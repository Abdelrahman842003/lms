<?php

declare(strict_types=1);

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createTrialEnrollmentWithBlockedTeacher(): array
{
    $student = Student::factory()->create();

    // No active teacher/academy subscription means subscription is blocked.
    $teacher = Teacher::factory()->create([
        'status' => 'active',
        'trial_period_days' => 4,
    ]);

    $profile = \App\Domains\Auth\Models\TeacherProfile::factory()->create([
        'teacher_id' => $teacher->id,
        'type' => 'independent',
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
        'teacher_profile_id' => $profile->id,
        'grade_id' => $grade->id,
        'group_id' => $group->id,
        'academy_id' => null,
        'is_active' => true,
        'subscription_start' => null,
        'subscription_end' => null,
        'created_at' => now()->subDay(),
    ]);

    return compact('student', 'teacher', 'enrollment');
}

it('keeps trial enrollment accessible in student me payload even when teacher subscription is blocked', function () {
    $context = createTrialEnrollmentWithBlockedTeacher();

    $response = $this->actingAs($context['student'], 'sanctum')
        ->getJson('/api/v1/student/me')
        ->assertOk();

    $response->assertJsonPath('data.teachers.0.teacher_profile_id', $context['enrollment']->teacher_profile_id);
    $response->assertJsonPath('data.teachers.0.status', 'trial');
    $response->assertJsonPath('data.teachers.0.is_subscription_blocked', true);
    $response->assertJsonPath('data.teachers.0.is_suspended', false);
});

it('allows student dashboard for trial enrollment even when teacher subscription is blocked', function () {
    $context = createTrialEnrollmentWithBlockedTeacher();

    $this->actingAs($context['student'], 'sanctum')
        ->getJson('/api/v1/student/dashboard?teacher_profile_id=' . $context['enrollment']->teacher_profile_id)
        ->assertOk();
});
