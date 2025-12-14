<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Teacher;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Student;
use App\Models\Lecture;
use App\Models\Attendance;
use App\Models\Exam;
use App\Models\ExamResult;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class FullDashboardSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get or Create Main Teacher
        $teacher = Teacher::firstOrCreate(
            ['username' => 'teacher'],
            [
                'name' => 'Demo Teacher',
                'password' => Hash::make('password'),
            ]
        );

        // 2. Create Grades
        $grades = [];
        $gradeNames = ['1st Secondary', '2nd Secondary', '3rd Secondary'];
        foreach ($gradeNames as $name) {
            $grades[] = Grade::firstOrCreate(
                ['name' => $name, 'teacher_id' => $teacher->id]
            );
        }

        // 3. Create Groups & Students
        foreach ($grades as $grade) {
            // Create 2 groups per grade
            $groups = Group::factory(2)->create([
                'teacher_id' => $teacher->id,
                'grade_id' => $grade->id,
            ]);

            foreach ($groups as $group) {
                // Create 5 students per group
                Student::factory(5)->create([
                    'teacher_id' => $teacher->id,
                    'grade_id' => $grade->id,
                    'group_id' => $group->id,
                ]);
            }
        }

        // 4. Create Lectures & Attendance (Past Month)
        // Create 8 lectures for the past month
        $students = $teacher->students;
        
        for ($i = 0; $i < 8; $i++) {
            $date = Carbon::now()->subDays(($i * 3) + 1); // Spread out over last ~24 days
            
            $lecture = Lecture::create([
                'teacher_id' => $teacher->id,
                'title' => "Lecture " . (8 - $i),
                'description' => 'Covering important topics.',
                'start_time' => $date->copy()->setHour(10),
                'end_time' => $date->copy()->setHour(12),
            ]);

            // Add attendance for each student
            foreach ($students as $student) {
                Attendance::create([
                    'lecture_id' => $lecture->id,
                    'student_id' => $student->id,
                    'status' => fake()->randomElement(['present', 'present', 'present', 'absent', 'late']), // Weighted towards present
                ]);
            }
        }

        // 5. Create Exams & Results
        // Create 2 exams
        for ($i = 1; $i <= 2; $i++) {
            $exam = Exam::create([
                'teacher_id' => $teacher->id,
                'title' => "Monthly Exam $i",
                'max_score' => 100,
                'date' => Carbon::now()->subDays($i * 10),
            ]);

            foreach ($students as $student) {
                ExamResult::create([
                    'exam_id' => $exam->id,
                    'student_id' => $student->id,
                    'score' => fake()->numberBetween(50, 100),
                ]);
            }
        }
    }
}
