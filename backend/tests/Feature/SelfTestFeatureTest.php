<?php

declare(strict_types=1);

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Exams\Models\Question;
use App\Domains\Exams\Models\ExamAttempt;
use App\Domains\Exams\Models\ExamResult;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows a student to start multiple self-tests for the same teacher without unique constraint errors', function () {
    // 1. Create a Student and a Teacher
    $student = Student::factory()->create();
    $teacher = Teacher::factory()->create([
        'status' => 'active',
    ]);

    // 2. Create Grade and Group for enrollment
    $grade = Grade::factory()->create([
        'teacher_id' => $teacher->id,
    ]);

    $group = Group::factory()->create([
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
    ]);

    // 3. Enroll student
    Enrollment::query()->create([
        'student_id' => $student->id,
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'group_id' => $group->id,
        'is_active' => true,
        'created_at' => now(),
    ]);

    // 4. Create questions in the question bank for this teacher and grade
    Question::query()->create([
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'text' => 'Easy question 1',
        'type' => 'mcq',
        'difficulty' => 'easy',
        'options' => ['A', 'B', 'C', 'D'],
        'correct_answer' => 'A',
    ]);

    Question::query()->create([
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'text' => 'Medium question 1',
        'type' => 'mcq',
        'difficulty' => 'medium',
        'options' => ['A', 'B', 'C', 'D'],
        'correct_answer' => 'A',
    ]);

    // 5. Start self-test 1
    $response1 = $this->actingAs($student, 'sanctum')
        ->postJson('/api/v1/student/self-test/start', [
            'teacher_id' => $teacher->id,
            'easy_count' => 1,
            'medium_count' => 1,
            'hard_count' => 0,
        ]);

    $response1->assertStatus(201);
    $attemptId1 = $response1->json('data.attempt_id');
    $this->assertNotEmpty($attemptId1);

    // 6. Start self-test 2 for the same teacher/student
    $response2 = $this->actingAs($student, 'sanctum')
        ->postJson('/api/v1/student/self-test/start', [
            'teacher_id' => $teacher->id,
            'easy_count' => 1,
            'medium_count' => 1,
            'hard_count' => 0,
        ]);

    $response2->assertStatus(201);
    $attemptId2 = $response2->json('data.attempt_id');
    $this->assertNotEmpty($attemptId2);

    // Verify they are different attempts
    $this->assertNotEquals($attemptId1, $attemptId2);

    // Verify there are 2 exam attempts in the database
    $this->assertEquals(2, ExamAttempt::where('student_id', $student->id)->count());
});

it('maintains separate results for different self-test attempts and displays them in history', function () {
    // 1. Create a Student and a Teacher
    $student = Student::factory()->create();
    $teacher = Teacher::factory()->create([
        'status' => 'active',
    ]);

    // 2. Create Grade and Group
    $grade = Grade::factory()->create([
        'teacher_id' => $teacher->id,
    ]);

    $group = Group::factory()->create([
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
    ]);

    // 3. Enroll student
    Enrollment::query()->create([
        'student_id' => $student->id,
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'group_id' => $group->id,
        'is_active' => true,
        'created_at' => now(),
    ]);

    // 4. Create single question
    $question = Question::query()->create([
        'teacher_id' => $teacher->id,
        'grade_id' => $grade->id,
        'text' => 'Self test question',
        'type' => 'mcq',
        'difficulty' => 'easy',
        'options' => ['A', 'B', 'C', 'D'],
        'correct_answer' => 'A',
    ]);

    // 5. Start attempt 1
    $response1 = $this->actingAs($student, 'sanctum')
        ->postJson('/api/v1/student/self-test/start', [
            'teacher_id' => $teacher->id,
            'easy_count' => 1,
            'medium_count' => 0,
            'hard_count' => 0,
        ]);
    $response1->assertStatus(201);
    $attemptId1 = $response1->json('data.attempt_id');

    // Answer attempt 1 correctly
    $answerResponse1 = $this->actingAs($student, 'sanctum')
        ->postJson("/api/v1/student/exams/attempts/{$attemptId1}/answer", [
            'answer' => 'A',
        ]);
    $answerResponse1->assertOk();

    // Verify first result created
    $this->assertEquals(1, ExamResult::where('attempt_id', $attemptId1)->count());
    $result1 = ExamResult::where('attempt_id', $attemptId1)->first();
    $this->assertEquals(100, $result1->percentage);

    // 6. Start attempt 2
    $response2 = $this->actingAs($student, 'sanctum')
        ->postJson('/api/v1/student/self-test/start', [
            'teacher_id' => $teacher->id,
            'easy_count' => 1,
            'medium_count' => 0,
            'hard_count' => 0,
        ]);
    $response2->assertStatus(201);
    $attemptId2 = $response2->json('data.attempt_id');

    // Answer attempt 2 incorrectly
    $answerResponse2 = $this->actingAs($student, 'sanctum')
        ->postJson("/api/v1/student/exams/attempts/{$attemptId2}/answer", [
            'answer' => 'B',
        ]);
    $answerResponse2->assertOk();

    // Verify second result created and points to second attempt
    $this->assertEquals(1, ExamResult::where('attempt_id', $attemptId2)->count());
    $result2 = ExamResult::where('attempt_id', $attemptId2)->first();
    $this->assertEquals(0, $result2->percentage);

    // Verify both attempts exist with their respective results
    $this->assertEquals(2, ExamResult::count());
    $this->assertEquals(2, ExamAttempt::count());

    // 7. Verify self-test history returns both attempts with their respective scores
    $historyResponse = $this->actingAs($student, 'sanctum')
        ->getJson("/api/v1/student/self-test/history?teacher_id={$teacher->id}");
    $historyResponse->assertOk();

    $historyData = $historyResponse->json('data.data');
    $this->assertCount(2, $historyData);

    // Assert correct scores are returned for each attempt
    $historyByAttempt = collect($historyData)->keyBy('id');
    $this->assertEquals(100, $historyByAttempt->get($attemptId1)['percentage']);
    $this->assertEquals(0, $historyByAttempt->get($attemptId2)['percentage']);
});
