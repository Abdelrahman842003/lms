<?php

declare(strict_types=1);

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAccessGrant;
use App\Domains\Videos\Models\VideoReminder;
use App\Domains\Videos\Models\VideoWatchProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function createPublishedVideoForStudent(Student $student): array
{
    $teacher = Teacher::factory()->create([
        'status' => 'active',
        'is_independent_active' => true,
    ]);

    $grade = Grade::factory()->create([
        'teacher_id' => $teacher->id,
    ]);

    $group = Group::factory()->create([
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
    ]);

    $enrollment = Enrollment::query()->create([
        'student_id' => $student->id,
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'group_id' => $group->id,
        'academy_id' => null,
        'is_active' => true,
        'subscription_start' => now()->subDay()->toDateString(),
        'subscription_end' => now()->addDays(5)->toDateString(),
    ]);

    $video = Video::query()->create([
        'owner_type' => VideoOwnerType::INDEPENDENT_TEACHER,
        'owner_id' => $teacher->id,
        'uploader_type' => Teacher::class,
        'uploader_id' => $teacher->id,
        'teacher_reference_id' => $teacher->id,
        'teacher_reference_name' => $teacher->name,
        'grade_id' => $grade->id,
        'title' => 'Secure Video',
        'status' => VideoStatus::PUBLISHED,
        'processing_status' => VideoProcessingStatus::SUCCEEDED,
        'processed_path' => 'videos/processed/' . Str::uuid() . '/master-720p.mp4',
        'duration_seconds' => 100,
        'published_at' => now()->subMinute(),
    ]);

    $video->groups()->sync([$group->id]);

    VideoAccessGrant::query()->create([
        'video_id' => $video->id,
        'student_id' => $student->id,
        'teacher_id' => $teacher->id,
        'enrollment_id' => $enrollment->id,
        'granted_group_id' => $group->id,
        'granted_at' => now(),
        'eligibility_snapshot' => [
            'grade_id' => $grade->id,
            'group_id' => $group->id,
        ],
    ]);

    return compact('teacher', 'grade', 'group', 'enrollment', 'video');
}

it('denies playback token for student without access grant', function () {
    $student = Student::factory()->create();

    $teacher = Teacher::factory()->create([
        'status' => 'active',
        'is_independent_active' => true,
    ]);

    $grade = Grade::factory()->create(['teacher_id' => $teacher->id]);
    $group = Group::factory()->create(['teacher_id' => $teacher->id, 'grade_id' => $grade->id]);

    $video = Video::query()->create([
        'owner_type' => VideoOwnerType::INDEPENDENT_TEACHER,
        'owner_id' => $teacher->id,
        'uploader_type' => Teacher::class,
        'uploader_id' => $teacher->id,
        'grade_id' => $grade->id,
        'title' => 'Unreachable Video',
        'status' => VideoStatus::PUBLISHED,
        'processing_status' => VideoProcessingStatus::SUCCEEDED,
        'processed_path' => 'videos/processed/' . Str::uuid() . '/master-720p.mp4',
        'published_at' => now()->subMinute(),
    ]);

    $video->groups()->sync([$group->id]);

    $this->actingAs($student, 'sanctum')
        ->postJson("/api/v1/student/videos/{$video->id}/playback-token", [
            'device_fingerprint' => 'device_a',
            'session_id' => 'session_a',
        ])
        ->assertStatus(403);
});

it('lists and allows playback for eligible student without snapshot grant', function () {
    $student = Student::factory()->create();

    $teacher = Teacher::factory()->create([
        'status' => 'active',
        'is_independent_active' => true,
    ]);

    $grade = Grade::factory()->create(['teacher_id' => $teacher->id]);
    $group = Group::factory()->create([
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
    ]);

    Enrollment::query()->create([
        'student_id' => $student->id,
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'group_id' => $group->id,
        'academy_id' => null,
        'is_active' => true,
        'subscription_start' => now()->subDay()->toDateString(),
        'subscription_end' => now()->addDays(10)->toDateString(),
    ]);

    $video = Video::query()->create([
        'owner_type' => VideoOwnerType::INDEPENDENT_TEACHER,
        'owner_id' => $teacher->id,
        'uploader_type' => Teacher::class,
        'uploader_id' => $teacher->id,
        'teacher_reference_id' => $teacher->id,
        'teacher_reference_name' => $teacher->name,
        'grade_id' => $grade->id,
        'title' => 'Visible Without Grant',
        'status' => VideoStatus::PUBLISHED,
        'processing_status' => VideoProcessingStatus::SUCCEEDED,
        'processed_path' => 'videos/processed/' . Str::uuid() . '/master-720p.mp4',
        'published_at' => now()->subMinute(),
    ]);

    $video->groups()->sync([$group->id]);

    $listResponse = $this->actingAs($student, 'sanctum')
        ->getJson('/api/v1/student/videos')
        ->assertOk();

    $decoded = json_decode((string) $listResponse->getContent(), true);
    $listItems = collect(data_get($decoded, 'data.data', []));
    expect($listItems->pluck('id')->contains($video->id))->toBeTrue();

    $this->actingAs($student, 'sanctum')
        ->postJson("/api/v1/student/videos/{$video->id}/playback-token", [
            'device_fingerprint' => 'device_without_grant',
            'session_id' => 'session_without_grant',
        ])
        ->assertOk();
});

it('issues playback token for eligible student', function () {
    $student = Student::factory()->create();
    $context = createPublishedVideoForStudent($student);

    $response = $this->actingAs($student, 'sanctum')
        ->postJson("/api/v1/student/videos/{$context['video']->id}/playback-token", [
            'device_fingerprint' => 'device_b',
            'session_id' => 'session_b',
        ])
        ->assertOk();

    $response->assertJsonPath('data.token', fn ($value) => is_string($value) && strlen($value) > 20);
    $response->assertJsonPath('data.watermark.enabled', true);
});

it('marks watch progress as completed and stops reminders', function () {
    $student = Student::factory()->create();
    $context = createPublishedVideoForStudent($student);

    VideoReminder::query()->create([
        'video_id' => $context['video']->id,
        'student_id' => $student->id,
        'guardian_id' => null,
        'attempts' => 0,
        'next_reminder_at' => now()->addHours(12),
    ]);

    $this->actingAs($student, 'sanctum')
        ->postJson("/api/v1/student/videos/{$context['video']->id}/progress", [
            'watched_seconds' => 100,
            'last_position_seconds' => 100,
        ])
        ->assertOk()
        ->assertJsonPath('data.progress.status', 'completed');

    $progress = VideoWatchProgress::query()
        ->where('video_id', $context['video']->id)
        ->where('student_id', $student->id)
        ->first();

    expect($progress)->not->toBeNull();
    expect($progress->status->value)->toBe('completed');

    $reminder = VideoReminder::query()
        ->where('video_id', $context['video']->id)
        ->where('student_id', $student->id)
        ->first();

    expect($reminder)->not->toBeNull();
    expect($reminder->stopped_at)->not->toBeNull();
    expect($reminder->stop_reason)->toBe('completed');
});
