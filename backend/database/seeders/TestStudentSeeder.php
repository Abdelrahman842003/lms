<?php

namespace Database\Seeders;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestStudentSeeder extends Seeder
{
    public function run()
    {
        // 1. Create or Get the Student
        $student = Student::firstOrCreate(
            ['phone' => '01093273116'],
            [
                'name' => 'Test Student',
                'password' => Hash::make('password'),
                'parent_phone' => '01000000000',
                'gender' => 'male',
                'education_type' => 'general',
                'location' => 'Cairo',
            ]
        );

        $this->command->info("Student: {$student->name} ({$student->phone})");

        // 2. Create 5 Teachers if they don't exist
        $teachersCount = Teacher::count();
        if ($teachersCount < 5) {
            Teacher::factory()->count(5 - $teachersCount)->create();
        }
        $teachers = Teacher::inRandomOrder()->take(5)->get();

        // 3. Define Scenarios
        $scenarios = [
            0 => [ // Teacher 1: Active (Wallet 500, High Attendance, Good Grades)
                'balance' => 500,
                'lectures' => ['upcoming' => 2, 'purchased' => 1, 'available' => 1],
                'exams' => ['completed' => 1, 'available' => 1],
                'attendance_rate' => 1.0, // 100%
                'exam_score' => 90,
            ],
            1 => [ // Teacher 2: New (Wallet 100, No Activity)
                'balance' => 100,
                'lectures' => ['upcoming' => 1, 'purchased' => 0, 'available' => 2],
                'exams' => ['completed' => 0, 'available' => 2],
                'attendance_rate' => 0,
                'exam_score' => 0,
            ],
            2 => [ // Teacher 3: Struggling (Wallet 0, Mixed Attendance, Low Grades)
                'balance' => 0,
                'lectures' => ['upcoming' => 0, 'purchased' => 2, 'available' => 0],
                'exams' => ['completed' => 2, 'available' => 0],
                'attendance_rate' => 0.5, // 50%
                'exam_score' => 60, // Average
            ],
            3 => [ // Teacher 4: Top (Wallet 1200, Perfect)
                'balance' => 1200,
                'lectures' => ['upcoming' => 3, 'purchased' => 5, 'available' => 5],
                'exams' => ['completed' => 3, 'available' => 3],
                'attendance_rate' => 1.0,
                'exam_score' => 100,
            ],
            4 => [ // Teacher 5: Debtor (Wallet -50, Inactive)
                'balance' => -50,
                'lectures' => ['upcoming' => 0, 'purchased' => 0, 'available' => 0],
                'exams' => ['completed' => 0, 'available' => 0],
                'attendance_rate' => 0,
                'exam_score' => 0,
            ],
        ];

        foreach ($teachers as $index => $teacher) {
            $scenario = $scenarios[$index] ?? $scenarios[0];
            $this->command->info("Seeding Teacher {$index}: {$teacher->name} (Scenario: Balance {$scenario['balance']})");

            // Ensure Grade & Group
            $grade = $teacher->grades()->first() ?? Grade::factory()->create(['teacher_id' => $teacher->id]);
            $group = $teacher->groups()->where('grade_id', $grade->id)->first() ?? Group::factory()->create(['teacher_id' => $teacher->id, 'grade_id' => $grade->id]);

            // Enrollment
            Enrollment::updateOrCreate(
                ['student_id' => $student->id, 'teacher_id' => $teacher->id],
                [
                    'grade_id' => $grade->id,
                    'group_id' => $group->id,
                    'balance' => $scenario['balance'],
                    'is_active' => true,
                    'subscription_start' => Carbon::now(),
                ]
            );

            // Lectures
            // Upcoming
            \App\Models\Lecture::factory()->count($scenario['lectures']['upcoming'])->create([
                'teacher_id' => $teacher->id,
                // 'grade_id' => $grade->id, // Removed as per schema
                'start_time' => Carbon::tomorrow()->setTime(10, 0),
                'end_time' => Carbon::tomorrow()->setTime(12, 0),
            ]);

            // Purchased (Attended/Absent based on rate)
            $purchasedCount = $scenario['lectures']['purchased'];
            if ($purchasedCount > 0) {
                $lectures = \App\Models\Lecture::factory()->count($purchasedCount)->create([
                    'teacher_id' => $teacher->id,
                    // 'grade_id' => $grade->id, // Removed
                    'start_time' => Carbon::yesterday()->setTime(10, 0),
                    'end_time' => Carbon::yesterday()->setTime(12, 0),
                    'price' => 50,
                ]);

                foreach ($lectures as $i => $lecture) {
                    // Simple logic: first X are present based on rate
                    $status = ($i < $purchasedCount * $scenario['attendance_rate']) ? 'present' : 'absent';
                    \App\Models\Attendance::create([
                        'student_id' => $student->id,
                        'lecture_id' => $lecture->id,
                        'status' => $status,
                        'created_at' => Carbon::now(),
                    ]);
                }
            }

            // Available
            \App\Models\Lecture::factory()->count($scenario['lectures']['available'])->create([
                'teacher_id' => $teacher->id,
                // 'grade_id' => $grade->id, // Removed
                'start_time' => Carbon::today()->addDays(5)->setTime(14, 0),
                'end_time' => Carbon::today()->addDays(5)->setTime(16, 0),
                'price' => 100,
            ]);

            // Exams
            // Completed
            $completedCount = $scenario['exams']['completed'];
            if ($completedCount > 0) {
                $exams = \App\Models\Exam::factory()->count($completedCount)->create([
                    'teacher_id' => $teacher->id,
                    'grade_id' => $grade->id,
                    'max_score' => 100,
                ]);

                foreach ($exams as $exam) {
                    \App\Models\ExamResult::create([
                        'student_id' => $student->id,
                        'exam_id' => $exam->id,
                        'score' => $scenario['exam_score'],
                        // 'submitted_at' => Carbon::now(), // Removed as column doesn't exist
                    ]);
                }
            }

            // Available Exams
            \App\Models\Exam::factory()->count($scenario['exams']['available'])->create([
                'teacher_id' => $teacher->id,
                'grade_id' => $grade->id,
                'max_score' => 100,
                'date' => Carbon::tomorrow(),
            ]);
        }

        $this->command->info("Done! Seeded data for 5 teachers.");
    }
}
