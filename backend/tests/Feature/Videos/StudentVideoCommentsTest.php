<?php

declare(strict_types=1);

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoComment;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function setupVideoForCommentTest(Student $student): Video
{
    $teacher = Teacher::factory()->create([
        'status' => 'active',
        'is_independent_active' => true,
    ]);

    $grade = Grade::factory()->create(['teacher_id' => $teacher->id]);
    $group = Group::factory()->create(['teacher_id' => $teacher->id, 'grade_id' => $grade->id]);

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

    $video = Video::factory()->create([
        'owner_id' => $teacher->id,
        'uploader_id' => $teacher->id,
        'teacher_reference_id' => $teacher->id,
        'teacher_reference_name' => $teacher->name,
        'grade_id' => $grade->id,
    ]);

    $video->groups()->sync([$group->id]);

    return $video;
}

it('allows student to fetch video comments', function () {
    $student = Student::factory()->create();
    $video = setupVideoForCommentTest($student);

    VideoComment::factory()->count(3)->create([
        'video_id' => $video->id,
        'author_type' => Student::class,
        'author_id' => $student->id,
    ]);

    $this->actingAs($student, 'sanctum')
        ->getJson("/api/v1/student/videos/{$video->id}/comments")
        ->assertOk()
        ->assertJsonCount(3, 'data.data');
});

it('allows student to post a comment on a video', function () {
    $student = Student::factory()->create();
    $video = setupVideoForCommentTest($student);

    $this->actingAs($student, 'sanctum')
        ->postJson("/api/v1/student/videos/{$video->id}/comments", [
            'body' => 'This is a test comment',
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.comment.body', 'This is a test comment');

    $this->assertDatabaseHas('video_comments', [
        'video_id' => $video->id,
        'author_id' => $student->id,
        'body' => 'This is a test comment',
    ]);
});

it('allows student to delete their own comment', function () {
    $student = Student::factory()->create();
    $video = setupVideoForCommentTest($student);

    $comment = VideoComment::factory()->create([
        'video_id' => $video->id,
        'author_type' => Student::class,
        'author_id' => $student->id,
        'body' => 'My comment',
    ]);

    $this->actingAs($student, 'sanctum')
        ->deleteJson("/api/v1/student/videos/{$video->id}/comments/{$comment->id}")
        ->assertOk();

    $this->assertSoftDeleted('video_comments', [
        'id' => $comment->id,
    ]);
});

it('denies student from deleting another students comment', function () {
    $student = Student::factory()->create();
    $otherStudent = Student::factory()->create();
    $video = setupVideoForCommentTest($student);

    $comment = VideoComment::factory()->create([
        'video_id' => $video->id,
        'author_type' => Student::class,
        'author_id' => $otherStudent->id,
        'body' => 'Other students comment',
    ]);

    $this->actingAs($student, 'sanctum')
        ->deleteJson("/api/v1/student/videos/{$video->id}/comments/{$comment->id}")
        ->assertStatus(404);

    $this->assertDatabaseHas('video_comments', [
        'id' => $comment->id,
    ]);
});
