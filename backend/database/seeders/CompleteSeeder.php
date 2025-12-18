<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Teacher;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Student;
use App\Models\Secretary;
use App\Models\Lecture;
use App\Models\Attendance;
use App\Models\Exam;
use App\Models\Question;
use App\Models\ExamAttempt;
use App\Models\ExamResult;
use App\Models\StudentAnswer;
use App\Models\Enrollment;
use App\Models\PaymentLog;
use App\Models\GamificationSetting;
use App\Models\StudentPoint;
use App\Models\PointTransaction;
use App\Models\FailedQuestion;
use App\Models\StudentActivityLog;
use App\Models\Notification;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * Complete Seeder - يغطي كل جداول المشروع ببيانات تجريبية قليلة
 */
class CompleteSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 بدء إنشاء البيانات التجريبية...');

        // 1. إنشاء المدرس
        $teacher = $this->createTeacher();
        
        // 2. إنشاء السكرتارية
        $this->createSecretaries($teacher);
        
        // 3. إنشاء الصفوف والمجموعات
        $grades = $this->createGrades($teacher);
        $groups = $this->createGroups($teacher, $grades);
        
        // 4. إنشاء الطلاب والتسجيلات
        $students = $this->createStudentsWithEnrollments($teacher, $grades, $groups);
        
        // 5. إنشاء المحاضرات والحضور
        $lectures = $this->createLectures($teacher);
        $this->createAttendance($lectures, $students);
        
        // 6. إنشاء الامتحانات مع الأسئلة
        $exams = $this->createExamsWithQuestions($teacher, $grades);
        
        // 7. إنشاء محاولات الامتحان والنتائج
        $this->createExamAttempts($exams, $students);
        
        // 8. إنشاء نظام النقاط (Gamification)
        $this->createGamification($teacher, $students);
        
        // 9. إنشاء المدفوعات
        $this->createPayments($teacher, $students);
        
        // 10. إنشاء الأسئلة الخاطئة
        $this->createFailedQuestions($teacher, $students, $exams);
        
        // 11. إنشاء سجل النشاط
        $this->createActivityLogs($students);

        $this->command->info('✅ تم إنشاء كل البيانات بنجاح!');
        $this->printSummary();
    }

    private function createTeacher(): Teacher
    {
        $this->command->info('👨‍🏫 إنشاء المدرس...');
        
        return Teacher::firstOrCreate(
            ['username' => 'demo_teacher'],
            [
                'name' => 'أحمد محمد',
                'password' => Hash::make('password'),
                'phone' => '01012345678',
            ]
        );
    }

    private function createSecretaries(Teacher $teacher): void
    {
        $this->command->info('👩‍💼 إنشاء السكرتارية...');
        
        Secretary::firstOrCreate(
            ['username' => 'secretary1', 'teacher_id' => $teacher->id],
            [
                'name' => 'فاطمة علي',
                'password' => Hash::make('password'),
                'phone' => '01111111111',
            ]
        );
    }

    private function createGrades(Teacher $teacher): array
    {
        $this->command->info('📚 إنشاء الصفوف...');
        
        $gradeNames = ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'];
        $grades = [];
        
        foreach ($gradeNames as $name) {
            $grades[] = Grade::firstOrCreate(
                ['name' => $name, 'teacher_id' => $teacher->id]
            );
        }
        
        return $grades;
    }

    private function createGroups(Teacher $teacher, array $grades): array
    {
        $this->command->info('👥 إنشاء المجموعات...');
        
        $groups = [];
        foreach ($grades as $grade) {
            $groups[] = Group::firstOrCreate(
                ['name' => 'مجموعة أ - ' . $grade->name, 'teacher_id' => $teacher->id, 'grade_id' => $grade->id]
            );
            $groups[] = Group::firstOrCreate(
                ['name' => 'مجموعة ب - ' . $grade->name, 'teacher_id' => $teacher->id, 'grade_id' => $grade->id]
            );
        }
        
        return $groups;
    }

    private function createStudentsWithEnrollments(Teacher $teacher, array $grades, array $groups): array
    {
        $this->command->info('👨‍🎓 إنشاء الطلاب والتسجيلات...');
        
        $studentNames = [
            'محمد أحمد', 'علي محمود', 'عمر حسن', 'يوسف كريم', 'أحمد فتحي',
            'مريم سعيد', 'نور الهدى', 'فاطمة محمد', 'سارة أحمد', 'ريم علي'
        ];
        
        $students = [];
        $i = 0;
        
        foreach ($studentNames as $name) {
            $i++;
            $student = Student::firstOrCreate(
                ['username' => 'student' . $i],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'phone' => '010' . str_pad($i, 8, '0', STR_PAD_LEFT),
                    'parent_phone' => '011' . str_pad($i, 8, '0', STR_PAD_LEFT),
                ]
            );
            
            $students[] = $student;
            
            // تسجيل الطالب
            $gradeIndex = $i % count($grades);
            $groupIndex = $i % count($groups);
            
            Enrollment::firstOrCreate(
                ['student_id' => $student->id, 'teacher_id' => $teacher->id],
                [
                    'grade_id' => $grades[$gradeIndex]->id,
                    'group_id' => $groups[$groupIndex]->id,
                    'balance' => rand(0, 500),
                    'is_active' => true,
                    'subscription_start' => Carbon::now()->subDays(rand(0, 30)),
                    'subscription_end' => Carbon::now()->addDays(rand(10, 60)),
                ]
            );
        }
        
        return $students;
    }

    private function createLectures(Teacher $teacher): array
    {
        $this->command->info('📖 إنشاء المحاضرات...');
        
        $lectures = [];
        
        // محاضرات سابقة
        for ($i = 1; $i <= 3; $i++) {
            $date = Carbon::now()->subDays($i * 3);
            $lectures[] = Lecture::firstOrCreate(
                ['title' => "محاضرة $i - الفيزياء", 'teacher_id' => $teacher->id],
                [
                    'description' => 'شرح الفصل ' . $i,
                    'start_time' => $date->copy()->setHour(10),
                    'end_time' => $date->copy()->setHour(12),
                ]
            );
        }
        
        // محاضرات قادمة
        for ($i = 1; $i <= 2; $i++) {
            $date = Carbon::now()->addDays($i * 2);
            $lectures[] = Lecture::firstOrCreate(
                ['title' => "محاضرة قادمة $i", 'teacher_id' => $teacher->id],
                [
                    'description' => 'محاضرة جديدة',
                    'start_time' => $date->copy()->setHour(14),
                    'end_time' => $date->copy()->setHour(16),
                ]
            );
        }
        
        return $lectures;
    }

    private function createAttendance(array $lectures, array $students): void
    {
        $this->command->info('✅ إنشاء سجلات الحضور...');
        
        foreach ($lectures as $lecture) {
            foreach ($students as $student) {
                if (rand(0, 10) > 2) { // 80% حضور
                    Attendance::firstOrCreate(
                        ['lecture_id' => $lecture->id, 'student_id' => $student->id],
                        ['status' => fake()->randomElement(['present', 'present', 'present', 'late'])]
                    );
                }
            }
        }
    }

    private function createExamsWithQuestions(Teacher $teacher, array $grades): array
    {
        $this->command->info('📝 إنشاء الامتحانات والأسئلة...');
        
        $exams = [];
        
        foreach ($grades as $index => $grade) {
            $exam = Exam::firstOrCreate(
                ['title' => 'اختبار شهري - ' . $grade->name, 'teacher_id' => $teacher->id],
                [
                    'subject' => 'فيزياء',
                    'max_score' => 50,
                    'duration' => 30,
                    'grade_id' => $grade->id,
                    'date' => Carbon::now()->subDays($index * 5),
                    'is_active' => true,
                    'actual_question_count' => 5,
                    'time_per_question' => 60,
                ]
            );
            
            // إضافة أسئلة
            for ($q = 1; $q <= 5; $q++) {
                Question::firstOrCreate(
                    ['exam_id' => $exam->id, 'text' => "سؤال $q للامتحان " . ($index + 1) . ": ما هي الإجابة الصحيحة؟"],
                    [
                        'options' => json_encode(['أ - الخيار الأول', 'ب - الخيار الثاني', 'ج - الخيار الثالث', 'د - الخيار الرابع']),
                        'correct_answer' => fake()->randomElement(['أ - الخيار الأول', 'ب - الخيار الثاني', 'ج - الخيار الثالث', 'د - الخيار الرابع']),
                    ]
                );
            }
            
            $exams[] = $exam;
        }
        
        return $exams;
    }

    private function createExamAttempts(array $exams, array $students): void
    {
        $this->command->info('📊 إنشاء نتائج الامتحانات...');
        
        foreach ($exams as $exam) {
            $questions = Question::where('exam_id', $exam->id)->get();
            $questionIds = $questions->pluck('id')->toArray();
            
            foreach (array_slice($students, 0, 5) as $student) {
                // محاولة امتحان
                $attempt = ExamAttempt::firstOrCreate(
                    ['exam_id' => $exam->id, 'student_id' => $student->id],
                    [
                        'started_at' => Carbon::now()->subHours(rand(1, 48)),
                        'completed_at' => Carbon::now()->subHours(rand(1, 48))->addMinutes(25),
                        'status' => 'completed',
                        'questions_order' => json_encode($questionIds),
                        'current_question_index' => count($questionIds),
                    ]
                );
                
                // إجابات الأسئلة
                $correctCount = 0;
                foreach ($questions as $question) {
                    $isCorrect = rand(0, 1) ? true : false;
                    if ($isCorrect) $correctCount++;
                    
                    StudentAnswer::firstOrCreate(
                        ['exam_attempt_id' => $attempt->id, 'question_id' => $question->id],
                        [
                            'answer' => fake()->randomElement(['أ - الخيار الأول', 'ب - الخيار الثاني']),
                            'is_correct' => $isCorrect,
                            'answered_at' => Carbon::now()->subHours(rand(1, 48)),
                        ]
                    );
                }
                
                // نتيجة الامتحان
                $score = ($correctCount / max(count($questions), 1)) * $exam->max_score;
                ExamResult::firstOrCreate(
                    ['exam_id' => $exam->id, 'student_id' => $student->id],
                    ['score' => round($score)]
                );
            }
        }
    }

    private function createGamification(Teacher $teacher, array $students): void
    {
        $this->command->info('🎮 إنشاء نظام النقاط...');
        
        // إعدادات النقاط
        GamificationSetting::firstOrCreate(
            ['teacher_id' => $teacher->id],
            [
                'attendance_points' => 10,
                'perfect_month_bonus' => 30,
                'exam_max_points' => 50,
                'exam_retake_bonus' => 20,
                'exam_first_place_bonus' => 25,
                'streak_5_bonus' => 15,
                'streak_10_bonus' => 30,
                'is_enabled' => true,
                'show_leaderboard' => true,
                'leaderboard_size' => 5,
            ]
        );
        
        // نقاط الطلاب
        foreach ($students as $index => $student) {
            $points = StudentPoint::firstOrCreate(
                ['student_id' => $student->id, 'teacher_id' => $teacher->id],
                [
                    'total_points' => rand(50, 500),
                    'attendance_streak' => rand(0, 10),
                ]
            );
            
            // معاملات النقاط
            PointTransaction::firstOrCreate(
                ['student_id' => $student->id, 'teacher_id' => $teacher->id, 'type' => 'attendance'],
                [
                    'points' => 10,
                    'description' => 'حضور محاضرة',
                ]
            );
        }
    }

    private function createPayments(Teacher $teacher, array $students): void
    {
        $this->command->info('💰 إنشاء المدفوعات...');
        
        // دفعات مختلفة الحالات
        $statuses = ['pending', 'confirmed', 'expired'];
        
        foreach (array_slice($students, 0, 3) as $index => $student) {
            // Get enrollment for this student
            $enrollment = Enrollment::where('student_id', $student->id)
                ->where('teacher_id', $teacher->id)
                ->first();
            
            if (!$enrollment) continue;
            
            PaymentLog::firstOrCreate(
                ['student_id' => $student->id, 'teacher_id' => $teacher->id, 'confirmation_code' => 'TEST-' . strtoupper(substr(md5($index), 0, 4))],
                [
                    'enrollment_id' => $enrollment->id,
                    'client_side_uuid' => fake()->uuid(),
                    'amount' => rand(100, 300),
                    'status' => $statuses[$index % 3],
                    'payment_method' => 'cash',
                    'expires_at' => Carbon::now()->addDays(7),
                    'confirmed_at' => $statuses[$index % 3] === 'confirmed' ? Carbon::now() : null,
                    'received_by_type' => 'App\\Models\\Teacher',
                    'received_by_id' => $teacher->id,
                ]
            );
        }
    }

    private function createFailedQuestions(Teacher $teacher, array $students, array $exams): void
    {
        $this->command->info('❌ إنشاء الأسئلة الخاطئة...');
        
        foreach (array_slice($students, 0, 3) as $student) {
            foreach ($exams as $exam) {
                $questions = Question::where('exam_id', $exam->id)->take(2)->get();
                
                foreach ($questions as $question) {
                    FailedQuestion::firstOrCreate(
                        ['student_id' => $student->id, 'question_id' => $question->id],
                        [
                            'teacher_id' => $teacher->id,
                            'exam_id' => $exam->id,
                            'student_answer' => 'أ - الخيار الأول',
                            'times_failed' => rand(1, 3),
                            'is_mastered' => rand(0, 1) ? true : false,
                        ]
                    );
                }
            }
        }
    }

    private function createActivityLogs(array $students): void
    {
        $this->command->info('📋 إنشاء سجل النشاط...');
        
        $actions = ['enrolled', 'payment', 'status_change'];
        
        foreach (array_slice($students, 0, 5) as $student) {
            // Get enrollment
            $enrollment = Enrollment::where('student_id', $student->id)->first();
            
            foreach ($actions as $action) {
                StudentActivityLog::firstOrCreate(
                    ['student_id' => $student->id, 'action' => $action, 'enrollment_id' => $enrollment?->id],
                    [
                        'data' => json_encode(['note' => "Student performed: $action"]),
                        'performed_by_type' => 'App\\Models\\Teacher',
                        'performed_by_id' => $enrollment?->teacher_id,
                    ]
                );
            }
        }
    }

    private function printSummary(): void
    {
        $this->command->info('');
        $this->command->info('📊 ملخص البيانات المنشأة:');
        $this->command->info('========================');
        $this->command->info('👨‍🏫 المدرسين: ' . Teacher::count());
        $this->command->info('👩‍💼 السكرتارية: ' . Secretary::count());
        $this->command->info('📚 الصفوف: ' . Grade::count());
        $this->command->info('👥 المجموعات: ' . Group::count());
        $this->command->info('👨‍🎓 الطلاب: ' . Student::count());
        $this->command->info('📝 التسجيلات: ' . Enrollment::count());
        $this->command->info('📖 المحاضرات: ' . Lecture::count());
        $this->command->info('✅ الحضور: ' . Attendance::count());
        $this->command->info('📝 الامتحانات: ' . Exam::count());
        $this->command->info('❓ الأسئلة: ' . Question::count());
        $this->command->info('💰 المدفوعات: ' . PaymentLog::count());
        $this->command->info('========================');
        $this->command->info('');
        $this->command->info('🔑 بيانات الدخول:');
        $this->command->info('   المدرس: demo_teacher / password');
        $this->command->info('   السكرتير: secretary1 / password');
        $this->command->info('   الطالب: student1 / password');
    }
}
