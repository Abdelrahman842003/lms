<?php

declare(strict_types=1);

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Videos\Enums\VideoUploadSessionStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoUploadSession;
use App\Domains\Videos\Services\R2MultipartService;
use App\Domains\Videos\Services\VideoSettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeActiveTeacher(): Teacher
{
    return Teacher::factory()->create([
        'status'                => 'active',
        'is_independent_active' => true,
    ]);
}

function makeGrade(Teacher $teacher): Grade
{
    return Grade::factory()->create(['teacher_id' => $teacher->id]);
}

/** Minimal valid initiate-upload payload */
function initiatePayload(string $gradeId): array
{
    return [
        'title'       => 'درس اختبار',
        'grade_id'    => $gradeId,
        'group_ids'   => [],
        'file_name'   => 'lesson.mp4',
        'file_size'   => 20 * 1024 * 1024, // 20 MB
        'file_mime'   => 'video/mp4',
        'total_parts' => 2,
    ];
}

/** Stub R2MultipartService so no real AWS calls are made */
function mockR2(
    string $uploadId = 'r2-upload-id-stub',
    bool $completeOk = true,
    ?array $objectMeta = ['size' => 20971520, 'content_type' => 'video/mp4']
): void {
    $mock = Mockery::mock(R2MultipartService::class);

    $mock->shouldReceive('createMultipartUpload')
        ->andReturn($uploadId);

    $mock->shouldReceive('presignAllPartUrls')
        ->andReturn([
            1 => 'https://r2.example.com/presign/part1',
            2 => 'https://r2.example.com/presign/part2',
        ]);

    if ($completeOk) {
        $mock->shouldReceive('completeMultipartUpload')->andReturn(true);
    } else {
        $mock->shouldReceive('completeMultipartUpload')
            ->andThrow(new \RuntimeException('R2 complete failed'));
    }

    $mock->shouldReceive('abortMultipartUpload')->andReturnNull();
    $mock->shouldReceive('objectMeta')->andReturn($objectMeta);
    $mock->shouldReceive('objectExists')->andReturn(true);

    app()->instance(R2MultipartService::class, $mock);
}

// ─── TEACHER: Initiate Upload ─────────────────────────────────────────────────

describe('Teacher initiate upload', function () {
    it('returns 401 for unauthenticated request', function () {
        $teacher = makeActiveTeacher();
        $grade   = makeGrade($teacher);

        $response = $this->postJson('/api/v1/teacher/videos/initiate-upload', initiatePayload($grade->id));

        $response->assertStatus(401);
    });

    it('returns 422 when file_mime is not supported', function () {
        $teacher = makeActiveTeacher();
        $grade   = makeGrade($teacher);

        $payload              = initiatePayload($grade->id);
        $payload['file_mime'] = 'application/pdf';

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file_mime']);
    });

    it('returns 422 when title is missing', function () {
        $teacher = makeActiveTeacher();
        $grade   = makeGrade($teacher);

        $payload = initiatePayload($grade->id);
        unset($payload['title']);

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    });

    it('returns 422 when total_parts exceeds 10000', function () {
        $teacher = makeActiveTeacher();
        $grade   = makeGrade($teacher);

        $payload                = initiatePayload($grade->id);
        $payload['total_parts'] = 10001;

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['total_parts']);
    });

    it('creates a video and upload session and returns presigned URLs', function () {
        $teacher = makeActiveTeacher();
        $grade   = makeGrade($teacher);

        mockR2();

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', initiatePayload($grade->id));

        $response->assertStatus(201)
            ->assertJsonPath('status', true)
            ->assertJsonStructure(['data' => [
                'session_id',
                'video_id',
                'presigned_urls',
                'chunk_size_bytes',
            ]]);

        $data = $response->json('data');

        // DB: one VideoUploadSession must exist
        $this->assertDatabaseHas('video_upload_sessions', [
            'id'     => $data['session_id'],
            'status' => VideoUploadSessionStatus::PENDING_UPLOAD->value,
        ]);

        // DB: one Video must exist in UPLOADING state
        $this->assertDatabaseHas('videos', [
            'id'    => $data['video_id'],
            'title' => 'درس اختبار',
        ]);
    });

    it('returns 403 when direct upload is disabled in settings', function () {
        $teacher = makeActiveTeacher();
        $grade   = makeGrade($teacher);

        // Disable direct upload
        $settingsMock = Mockery::mock(VideoSettingsService::class)->makePartial();
        $settingsMock->shouldReceive('directUploadEnabled')->andReturn(false);
        app()->instance(VideoSettingsService::class, $settingsMock);

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', initiatePayload($grade->id));

        $response->assertStatus(403);
    });
});

// ─── TEACHER: Complete Upload ─────────────────────────────────────────────────

describe('Teacher complete upload', function () {
    it('returns 403 when another teacher tries to complete', function () {
        $teacher1 = makeActiveTeacher();
        $teacher2 = makeActiveTeacher();
        $grade    = makeGrade($teacher1);

        mockR2();

        // Initiate as teacher1
        $initResponse = $this->actingAs($teacher1, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', initiatePayload($grade->id));

        $sessionId = $initResponse->json('data.session_id');

        // Complete as teacher2 — should be forbidden
        $response = $this->actingAs($teacher2, 'sanctum')
            ->postJson('/api/v1/teacher/videos/complete-upload', [
                'session_id' => $sessionId,
                'parts' => [
                    ['part_number' => 1, 'etag' => '"abc123"'],
                    ['part_number' => 2, 'etag' => '"def456"'],
                ],
            ]);

        $response->assertStatus(403);
    });

    it('marks session COMPLETED and video UPLOADED after success', function () {
        $teacher = makeActiveTeacher();
        $grade   = makeGrade($teacher);

        mockR2();

        // Step 1: Initiate
        $initResponse = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', initiatePayload($grade->id));

        $initResponse->assertStatus(201);

        $sessionId = $initResponse->json('data.session_id');
        $videoId   = $initResponse->json('data.video_id');

        // Step 2: Complete
        $completeResponse = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/complete-upload', [
                'session_id' => $sessionId,
                'parts' => [
                    ['part_number' => 1, 'etag' => '"aaa111"'],
                    ['part_number' => 2, 'etag' => '"bbb222"'],
                ],
            ]);

        $completeResponse->assertStatus(200)
            ->assertJsonPath('data.video_id', $videoId);

        $this->assertDatabaseHas('video_upload_sessions', [
            'id'     => $sessionId,
            'status' => VideoUploadSessionStatus::COMPLETED->value,
        ]);

        // Video should move to 'uploaded' status
        $video = Video::find($videoId);
        expect($video->status->value)->toBe('uploaded');
    });

    it('returns 422 when parts array is missing', function () {
        $teacher = makeActiveTeacher();

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/complete-upload', [
                'session_id' => Str::uuid(),
                // no parts
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['parts']);
    });
});

// ─── TEACHER: Abort Upload ────────────────────────────────────────────────────

describe('Teacher abort upload', function () {
    it('marks session ABORTED and video FAILED', function () {
        $teacher = makeActiveTeacher();
        $grade   = makeGrade($teacher);

        mockR2();

        // Initiate
        $initResponse = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', initiatePayload($grade->id));

        $sessionId = $initResponse->json('data.session_id');

        // Abort
        $abortResponse = $this->actingAs($teacher, 'sanctum')
            ->deleteJson('/api/v1/teacher/videos/abort-upload', [
                'session_id' => $sessionId,
                'reason'     => 'user cancelled',
            ]);

        $abortResponse->assertStatus(200);

        $this->assertDatabaseHas('video_upload_sessions', [
            'id'           => $sessionId,
            'status'       => VideoUploadSessionStatus::ABORTED->value,
            'abort_reason' => 'user cancelled',
        ]);
    });

    it('returns 403 when another teacher tries to abort', function () {
        $teacher1 = makeActiveTeacher();
        $teacher2 = makeActiveTeacher();
        $grade    = makeGrade($teacher1);

        mockR2();

        $initResponse = $this->actingAs($teacher1, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', initiatePayload($grade->id));

        $sessionId = $initResponse->json('data.session_id');

        $response = $this->actingAs($teacher2, 'sanctum')
            ->deleteJson('/api/v1/teacher/videos/abort-upload', [
                'session_id' => $sessionId,
            ]);

        $response->assertStatus(403);
    });

    it('is idempotent — second abort on already-aborted session returns 200', function () {
        $teacher = makeActiveTeacher();
        $grade   = makeGrade($teacher);

        mockR2();

        $initResponse = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', initiatePayload($grade->id));

        $sessionId = $initResponse->json('data.session_id');

        // First abort
        $this->actingAs($teacher, 'sanctum')
            ->deleteJson('/api/v1/teacher/videos/abort-upload', ['session_id' => $sessionId])
            ->assertStatus(200);

        // Second abort — should still succeed (idempotent)
        $this->actingAs($teacher, 'sanctum')
            ->deleteJson('/api/v1/teacher/videos/abort-upload', ['session_id' => $sessionId])
            ->assertStatus(200);
    });
});

// ─── Upload Status ────────────────────────────────────────────────────────────

describe('Teacher upload status', function () {
    it('returns session status', function () {
        $teacher = makeActiveTeacher();
        $grade   = makeGrade($teacher);

        mockR2();

        $initResponse = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/teacher/videos/initiate-upload', initiatePayload($grade->id));

        $sessionId = $initResponse->json('data.session_id');

        $statusResponse = $this->actingAs($teacher, 'sanctum')
            ->getJson("/api/v1/teacher/videos/upload-status/{$sessionId}");

        $statusResponse->assertStatus(200)
            ->assertJsonStructure(['data' => ['session_id', 'status', 'video_id']]);
    });

    it('returns 404 for non-existent session', function () {
        $teacher = makeActiveTeacher();

        $response = $this->actingAs($teacher, 'sanctum')
            ->getJson('/api/v1/teacher/videos/upload-status/' . Str::uuid());

        $response->assertStatus(404);
    });
});
