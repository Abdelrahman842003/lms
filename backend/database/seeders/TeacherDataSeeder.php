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
use App\Models\Secretary;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

use App\Models\Enrollment;

class TeacherDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get or Create Main Demo Teacher
        $demoTeacher = Teacher::firstOrCreate(
            ['phone' => '01000000000'],
            [
                'name' => 'Demo Teacher',
                'password' => Hash::make('password'),
            ]
        );

        $this->seedTeacherData($demoTeacher);

        // 2. Create a few random teachers with data
        Teacher::factory(3)->create([
            'phone' => fn() => fake()->unique()->phoneNumber()
        ])->each(function ($teacher) {
            $this->seedTeacherData($teacher);
        });
    }

    private function seedTeacherData(Teacher $teacher)
    {
        // Create Secretaries
        Secretary::factory(2)->create([
            'teacher_id' => $teacher->id,
        ]);

        // Create Grades
        $grades = [];
        $gradeNames = ['1st Secondary', '2nd Secondary', '3rd Secondary'];
        foreach ($gradeNames as $name) {
            $grades[] = Grade::firstOrCreate(
                ['name' => $name, 'teacher_id' => $teacher->id]
            );
        }

        // Create Groups & Students
        $allStudents = [];
        $studentsByGrade = [];

        foreach ($grades as $grade) {
            $studentsByGrade[$grade->id] = [];

            // Create 2 groups per grade
            $groups = Group::factory(2)->create([
                'teacher_id' => $teacher->id,
                'grade_id' => $grade->id,
            ]);

            foreach ($groups as $group) {
                // Create 10 students per group
                $students = Student::factory(10)->create();
                
                foreach ($students as $student) {
                    Enrollment::create([
                        'student_id' => $student->id,
                        'teacher_id' => $teacher->id,
                        'grade_id' => $grade->id,
                        'group_id' => $group->id,
                        'academy_id' => $teacher->academies->first()?->id,
                        'balance' => fake()->randomFloat(2, 0, 1000),
                        'is_active' => true,
                        'subscription_start' => Carbon::now(),
                    ]);
                }

                $allStudents = array_merge($allStudents, $students->all());
                $studentsByGrade[$grade->id] = array_merge($studentsByGrade[$grade->id], $students->all());
            }
        }

        // Create Lectures & Attendance (Past Month)
        for ($i = 0; $i < 5; $i++) {
            $date = Carbon::now()->subDays(($i * 5) + 1);
            
            $lecture = Lecture::create([
                'teacher_id' => $teacher->id,
                'grade_id' => $grades[0]->id,
                'group_id' => $groups[0]->id,
                'title' => "Lecture " . (5 - $i) . " - " . $grades[0]->name,
                'description' => 'Important lecture covering key concepts.',
                'start_time' => $date->copy()->setHour(10),
                'end_time' => $date->copy()->setHour(12),
            ]);

            // Add attendance for some students
            foreach ($allStudents as $student) {
                if (rand(0, 1)) { // 50% chance of attendance record
                    Attendance::create([
                        'lecture_id' => $lecture->id,
                        'student_id' => $student->id,
                        'status' => fake()->randomElement(['present', 'present', 'absent', 'late']),
                    ]);
                }
            }
        }

        // Create Upcoming Lectures
        for ($i = 1; $i <= 3; $i++) {
            $date = Carbon::now()->addDays($i * 3);
            Lecture::create([
                'teacher_id' => $teacher->id,
                'grade_id' => $grades[0]->id,
                'group_id' => $groups[0]->id,
                'title' => "Upcoming Lecture $i",
                'description' => 'Future lecture.',
                'start_time' => $date->copy()->setHour(10),
                'end_time' => $date->copy()->setHour(12),
            ]);
        }

        // Create Exams & Results
        for ($i = 1; $i <= 2; $i++) {
            $exam = Exam::create([
                'teacher_id' => $teacher->id,
                'title' => "Monthly Exam $i",
                'subject' => 'General',
                'max_score' => 100,
                'date' => Carbon::now()->subDays($i * 10),
                'duration' => 60,
                'grade_id' => $grades[0]->id, // Assign to first grade for simplicity
            ]);

            if (isset($studentsByGrade[$grades[0]->id])) {
                foreach ($studentsByGrade[$grades[0]->id] as $student) {
                    ExamResult::create([
                        'exam_id' => $exam->id,
                        'student_id' => $student->id,
                        'score' => fake()->numberBetween(40, 100),
                    ]);
                }
            }
        }
    }
}
