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
use App\Domains\Videos\Models\VideoQuiz;
use App\Domains\Videos\Models\VideoQuizAttempt;
use App\Domains\Videos\Models\VideoWatchProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('includes per-student attendance and quiz analytics in teacher videos listing', function () {
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

    $studentOne = Student::factory()->create(['name' => 'طالب أول']);
    $studentTwo = Student::factory()->create(['name' => 'طالب ثان']);

    $video = Video::query()->create([
        'owner_type' => VideoOwnerType::INDEPENDENT_TEACHER,
        'owner_id' => $teacher->id,
        'uploader_type' => Teacher::class,
        'uploader_id' => $teacher->id,
        'teacher_reference_id' => $teacher->id,
        'teacher_reference_name' => $teacher->name,
        'grade_id' => $grade->id,
        'title' => 'محاضرة التحليل',
        'status' => VideoStatus::PUBLISHED,
        'processing_status' => VideoProcessingStatus::SUCCEEDED,
        'processed_path' => 'videos/processed/'.Str::uuid().'/master-720p.mp4',
        'duration_seconds' => 1200,
        'published_at' => now()->subMinute(),
    ]);

    $video->groups()->sync([$group->id]);

    VideoWatchProgress::query()->create([
        'video_id' => $video->id,
        'student_id' => $studentOne->id,
        'status' => 'in_progress',
        'watched_seconds' => 990,
        'watched_percentage' => 82.50,
        'last_position_seconds' => 990,
        'started_at' => now()->subDays(2),
        'last_watched_at' => now()->subDay(),
    ]);

    VideoWatchProgress::query()->create([
        'video_id' => $video->id,
        'student_id' => $studentTwo->id,
        'status' => 'started',
        'watched_seconds' => 360,
        'watched_percentage' => 30.00,
        'last_position_seconds' => 360,
        'started_at' => now()->subDay(),
        'last_watched_at' => now()->subHours(8),
    ]);

    $quiz = VideoQuiz::query()->create([
        'video_id' => $video->id,
        'teacher_id' => $teacher->id,
        'title' => 'اختبار الفيديو',
        'passing_score' => 60,
        'is_required' => true,
        'is_active' => true,
    ]);

    VideoQuizAttempt::query()->create([
        'video_quiz_id' => $quiz->id,
        'student_id' => $studentOne->id,
        'correct_count' => 2,
        'total_count' => 4,
        'percentage' => 50,
        'status' => 'failed',
        'answers' => ['q1' => 'a'],
        'completed_at' => now()->subHours(6),
    ]);

    VideoQuizAttempt::query()->create([
        'video_quiz_id' => $quiz->id,
        'student_id' => $studentOne->id,
        'correct_count' => 4,
        'total_count' => 4,
        'percentage' => 100,
        'status' => 'passed',
        'answers' => ['q1' => 'a'],
        'completed_at' => now()->subHours(2),
    ]);

    VideoQuizAttempt::query()->create([
        'video_quiz_id' => $quiz->id,
        'student_id' => $studentTwo->id,
        'correct_count' => 1,
        'total_count' => 4,
        'percentage' => 25,
        'status' => 'failed',
        'answers' => ['q1' => 'b'],
        'completed_at' => now()->subHours(1),
    ]);

    $response = $this->actingAs($teacher, 'sanctum')
        ->getJson('/api/v1/teacher/videos')
        ->assertOk();

    $payload = collect(data_get($response->json(), 'data.data', []))
        ->firstWhere('id', $video->id);

    expect($payload)->not->toBeNull();

    expect(data_get($payload, 'student_activity_summary.attended_students_count'))->toBe(2)
        ->and(data_get($payload, 'student_activity_summary.quiz_attempted_students_count'))->toBe(2)
        ->and(data_get($payload, 'student_activity_summary.quiz_attempts_count'))->toBe(3)
        ->and(data_get($payload, 'student_activity_summary.quiz_passed_students_count'))->toBe(1);

    $details = collect(data_get($payload, 'student_activity_details', []));

    $studentOneDetails = $details->firstWhere('student_id', $studentOne->id);
    $studentTwoDetails = $details->firstWhere('student_id', $studentTwo->id);

    expect($studentOneDetails)->not->toBeNull()
        ->and(data_get($studentOneDetails, 'student_name'))->toBe('طالب أول')
        ->and((float) data_get($studentOneDetails, 'watch.watched_percentage'))->toBe(82.5)
        ->and(data_get($studentOneDetails, 'quiz.attempted'))->toBeTrue()
        ->and(data_get($studentOneDetails, 'quiz.attempts_count'))->toBe(2)
        ->and((float) data_get($studentOneDetails, 'quiz.best_percentage'))->toBe(100.0)
        ->and(data_get($studentOneDetails, 'quiz.best_status'))->toBe('passed');

    expect($studentTwoDetails)->not->toBeNull()
        ->and(data_get($studentTwoDetails, 'student_name'))->toBe('طالب ثان')
        ->and((float) data_get($studentTwoDetails, 'watch.watched_percentage'))->toBe(30.0)
        ->and(data_get($studentTwoDetails, 'quiz.attempted'))->toBeTrue()
        ->and(data_get($studentTwoDetails, 'quiz.attempts_count'))->toBe(1)
        ->and((float) data_get($studentTwoDetails, 'quiz.best_percentage'))->toBe(25.0)
        ->and(data_get($studentTwoDetails, 'quiz.best_status'))->toBe('failed');
});

it('keeps student activity summary scoped to target students when enrollment targets are known', function () {
    $teacher = Teacher::factory()->create([
        'status' => 'active',
        'is_independent_active' => true,
    ]);

    $grade = Grade::factory()->create([
        'teacher_id' => $teacher->id,
    ]);

    $targetGroup = Group::factory()->create([
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
    ]);

    $otherGroup = Group::factory()->create([
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
    ]);

    $targetStudentOne = Student::factory()->create(['name' => 'طالب مستهدف 1']);
    $targetStudentTwo = Student::factory()->create(['name' => 'طالب مستهدف 2']);
    $outOfScopeStudent = Student::factory()->create(['name' => 'طالب خارج الاستهداف']);

    Enrollment::query()->create([
        'student_id' => $targetStudentOne->id,
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'group_id' => $targetGroup->id,
        'academy_id' => null,
        'is_active' => true,
        'balance' => 0,
    ]);

    Enrollment::query()->create([
        'student_id' => $targetStudentTwo->id,
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'group_id' => $targetGroup->id,
        'academy_id' => null,
        'is_active' => true,
        'balance' => 0,
    ]);

    Enrollment::query()->create([
        'student_id' => $outOfScopeStudent->id,
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'group_id' => $otherGroup->id,
        'academy_id' => null,
        'is_active' => true,
        'balance' => 0,
    ]);

    $video = Video::query()->create([
        'owner_type' => VideoOwnerType::INDEPENDENT_TEACHER,
        'owner_id' => $teacher->id,
        'uploader_type' => Teacher::class,
        'uploader_id' => $teacher->id,
        'teacher_reference_id' => $teacher->id,
        'teacher_reference_name' => $teacher->name,
        'grade_id' => $grade->id,
        'title' => 'فيديو بمستهدفين محددين',
        'status' => VideoStatus::PUBLISHED,
        'processing_status' => VideoProcessingStatus::SUCCEEDED,
        'processed_path' => 'videos/processed/'.Str::uuid().'/master-720p.mp4',
        'duration_seconds' => 600,
        'published_at' => now()->subMinute(),
    ]);

    $video->groups()->sync([$targetGroup->id]);

    VideoWatchProgress::query()->create([
        'video_id' => $video->id,
        'student_id' => $targetStudentOne->id,
        'status' => 'completed',
        'watched_seconds' => 600,
        'watched_percentage' => 100,
        'last_position_seconds' => 600,
        'started_at' => now()->subDays(2),
        'last_watched_at' => now()->subDays(1),
        'completed_at' => now()->subDays(1),
    ]);

    VideoWatchProgress::query()->create([
        'video_id' => $video->id,
        'student_id' => $targetStudentTwo->id,
        'status' => 'in_progress',
        'watched_seconds' => 120,
        'watched_percentage' => 20,
        'last_position_seconds' => 120,
        'started_at' => now()->subDay(),
        'last_watched_at' => now()->subHours(4),
    ]);

    VideoWatchProgress::query()->create([
        'video_id' => $video->id,
        'student_id' => $outOfScopeStudent->id,
        'status' => 'in_progress',
        'watched_seconds' => 300,
        'watched_percentage' => 50,
        'last_position_seconds' => 300,
        'started_at' => now()->subDay(),
        'last_watched_at' => now()->subHours(2),
    ]);

    $quiz = VideoQuiz::query()->create([
        'video_id' => $video->id,
        'teacher_id' => $teacher->id,
        'title' => 'اختبار مستهدف',
        'passing_score' => 60,
        'is_required' => true,
        'is_active' => true,
    ]);

    VideoQuizAttempt::query()->create([
        'video_quiz_id' => $quiz->id,
        'student_id' => $targetStudentOne->id,
        'correct_count' => 4,
        'total_count' => 4,
        'percentage' => 100,
        'status' => 'passed',
        'answers' => ['q1' => 'a'],
        'completed_at' => now()->subHours(6),
    ]);

    VideoQuizAttempt::query()->create([
        'video_quiz_id' => $quiz->id,
        'student_id' => $outOfScopeStudent->id,
        'correct_count' => 1,
        'total_count' => 4,
        'percentage' => 25,
        'status' => 'failed',
        'answers' => ['q1' => 'b'],
        'completed_at' => now()->subHours(3),
    ]);

    $response = $this->actingAs($teacher, 'sanctum')
        ->getJson('/api/v1/teacher/videos')
        ->assertOk();

    $payload = collect(data_get($response->json(), 'data.data', []))
        ->firstWhere('id', $video->id);

    expect($payload)->not->toBeNull();

    expect(data_get($payload, 'student_activity_summary.target_students_count'))->toBe(2)
        ->and(data_get($payload, 'student_activity_summary.attended_students_count'))->toBe(2)
        ->and(data_get($payload, 'student_activity_summary.quiz_attempted_students_count'))->toBe(1)
        ->and(data_get($payload, 'student_activity_summary.quiz_attempts_count'))->toBe(1)
        ->and(data_get($payload, 'student_activity_summary.quiz_passed_students_count'))->toBe(1);

    $details = collect(data_get($payload, 'student_activity_details', []));

    expect($details->firstWhere('student_id', $outOfScopeStudent->id))->not->toBeNull();
});

it('falls back to existing enrollments when no active enrollment rows are found', function () {
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

    $student = Student::factory()->create(['name' => 'طالب بدون تفعيل enrollment']);

    Enrollment::query()->create([
        'student_id' => $student->id,
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'group_id' => $group->id,
        'academy_id' => null,
        'is_active' => false,
        'balance' => 0,
    ]);

    $video = Video::query()->create([
        'owner_type' => VideoOwnerType::INDEPENDENT_TEACHER,
        'owner_id' => $teacher->id,
        'uploader_type' => Teacher::class,
        'uploader_id' => $teacher->id,
        'teacher_reference_id' => $teacher->id,
        'teacher_reference_name' => $teacher->name,
        'grade_id' => $grade->id,
        'title' => 'فيديو اختبار fallback enrollments',
        'status' => VideoStatus::PUBLISHED,
        'processing_status' => VideoProcessingStatus::SUCCEEDED,
        'processed_path' => 'videos/processed/'.Str::uuid().'/master-720p.mp4',
        'duration_seconds' => 900,
        'published_at' => now()->subMinute(),
    ]);

    $video->groups()->sync([$group->id]);

    $response = $this->actingAs($teacher, 'sanctum')
        ->getJson('/api/v1/teacher/videos')
        ->assertOk();

    $payload = collect(data_get($response->json(), 'data.data', []))
        ->firstWhere('id', $video->id);

    expect($payload)->not->toBeNull();

    expect(data_get($payload, 'student_activity_summary.target_students_count'))->toBe(1)
        ->and(data_get($payload, 'student_activity_summary.attended_students_count'))->toBe(0);

    $details = collect(data_get($payload, 'student_activity_details', []));
    $studentDetails = $details->firstWhere('student_id', $student->id);

    expect($studentDetails)->not->toBeNull()
        ->and(data_get($studentDetails, 'watch.status'))->toBe('not_started')
        ->and(data_get($studentDetails, 'quiz.attempted'))->toBeFalse();
});
