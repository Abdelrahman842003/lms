<?php

namespace Database\Seeders;

use App\Models\Teacher;
use App\Models\Student;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Enrollment;
use App\Models\Lecture;
use App\Models\Attendance;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\StudentPoint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ParentSummaryTestSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Creating test data for parent summary...');

        // 1. Create test teacher
        $teacher = Teacher::firstOrCreate(
            ['phone' => '01099999999'],
            [
                'name' => 'مدرس تجريبي',
                'password' => Hash::make('password'),
                'is_suspended' => false,
            ]
        );
        $this->command->info('✅ Created teacher: ' . $teacher->name);

        // 2. Get or create grade
        $grade = Grade::firstOrCreate(
            ['name' => 'الصف الأول الثانوي'],
            ['description' => 'الصف الأول الثانوي']
        );

        // 3. Create group
        $group = Group::firstOrCreate(
            [
                'teacher_id' => $teacher->id,
                'grade_id' => $grade->id,
                'name' => 'المجموعة التجريبية',
            ],
            [
                'description' => 'مجموعة تجريبية للاختبار',
                'max_students' => 50,
            ]
        );

        // 4. Get test students (from ParentTestSeeder)
        $students = Student::where('parent_phone', '01012345601')->get();
        
        if ($students->isEmpty()) {
            $this->command->error('❌ No test students found. Run ParentTestSeeder first.');
            return;
        }

        $this->command->info('📚 Found ' . $students->count() . ' test students');

        foreach ($students as $student) {
            // 5. Create enrollment
            $enrollment = Enrollment::firstOrCreate(
                [
                    'student_id' => $student->id,
                    'teacher_id' => $teacher->id,
                ],
                [
                    'grade_id' => $grade->id,
                    'group_id' => $group->id,
                    'is_active' => true,
                    'subscription_end' => Carbon::now()->addMonths(3),
                ]
            );

            // 6. Create lectures for the past month
            for ($i = 0; $i < 8; $i++) {
                $lectureDate = Carbon::now()->subDays($i * 3);
                
                $lecture = Lecture::firstOrCreate(
                    [
                        'teacher_id' => $teacher->id,
                        'title' => 'محاضرة ' . ($i + 1),
                    ],
                    [
                        'grade_id' => $grade->id,
                        'group_id' => $group->id,
                        'description' => 'محاضرة تجريبية رقم ' . ($i + 1),
                        'start_time' => $lectureDate->setTime(18, 0),
                        'duration' => 120,
                        'location' => 'قاعة 1',
                        'is_active' => false,
                    ]
                );

                // 7. Create attendance (80% present, 20% absent)
                Attendance::firstOrCreate(
                    [
                        'lecture_id' => $lecture->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'status' => $i % 5 === 0 ? 'absent' : 'present',
                        'marked_at' => $lectureDate,
                    ]
                );
            }

            // 8. Create exams
            for ($i = 0; $i < 4; $i++) {
                $examDate = Carbon::now()->subDays($i * 7);
                
                $exam = Exam::firstOrCreate(
                    [
                        'teacher_id' => $teacher->id,
                        'title' => 'امتحان ' . ($i + 1),
                    ],
                    [
                        'grade_id' => $grade->id,
                        'group_id' => $group->id,
                        'subject' => 'الرياضيات',
                        'description' => 'امتحان تجريبي رقم ' . ($i + 1),
                        'total_questions' => 20,
                        'actual_questions' => 20,
                        'duration' => 60,
                        'max_score' => 100,
                        'start_time' => $examDate->setTime(10, 0),
                        'end_time' => $examDate->setTime(11, 0),
                        'is_active' => false,
                        'created_at' => $examDate,
                    ]
                );

                // 9. Create exam results (scores between 70-95)
                ExamResult::firstOrCreate(
                    [
                        'exam_id' => $exam->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'score' => rand(70, 95),
                        'status' => 'completed',
                        'submitted_at' => $examDate->addHours(1),
                    ]
                );
            }

            // 10. Create student points
            StudentPoint::firstOrCreate(
                [
                    'student_id' => $student->id,
                    'teacher_id' => $teacher->id,
                ],
                [
                    'total_points' => rand(150, 300),
                    'weekly_points' => rand(20, 50),
                ]
            );

            $this->command->info('✅ Created data for student: ' . $student->name);
        }

        $this->command->info('🎉 Test data creation completed!');
        $this->command->info('📱 Login as parent: 01012345601 / password');
    }
}
