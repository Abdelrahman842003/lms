<?php

namespace Database\Seeders;

use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\TeacherProfile;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use Illuminate\Database\Seeder;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\Question;
use App\Domains\Exams\Models\ExamAttempt;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Exams\Models\StudentAnswer;
use App\Domains\Subscriptions\Models\PaymentLog;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\StudentPoint;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Exams\Models\FailedQuestion;
use App\Domains\Enrollments\Models\StudentActivityLog;
use App\Domains\Auth\Models\Guardian;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * Complete Seeder - Generates full test scenario:
 * - 3 Teachers (with profiles)
 * - 10 Students (Egyptian numbers)
 * - All students enrolled with all teachers
 * - Full data (lectures, exams, etc.) for all teachers
 */
class CompleteSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create();
        $this->command->info('🚀 Starting Test Scenario Seeding...');

        // 1. Create Teachers
        $teachers = $this->createTeachers();
        
        // 2. Create Students
        $students = $this->createStudents();

        foreach ($teachers as $teacher) {
            $this->command->info("👨‍🏫 Processing Teacher: {$teacher->name}...");

            // Create Independent Profile
            $profile = TeacherProfile::firstOrCreate(
                ['teacher_id' => $teacher->id, 'type' => 'independent'],
                [
                    'display_name' => $teacher->name . ' - مستقل',
                    'slug' => \Illuminate\Support\Str::slug($teacher->name) . '-independent-' . substr($teacher->id, 0, 4),
                    'status' => 'ACTIVE',
                ]
            );

            // 3. Create Secretaries for this teacher profile
            $this->createSecretaries($profile);
            
            // 4. Create Grades and Groups for this teacher profile
            $grades = $this->createGrades($profile);
            $groups = $this->createGroups($profile, $grades);
            
            // 5. Enroll ALL students with this teacher profile
            $this->enrollStudents($profile, $students, $grades, $groups);
            
            // 6. Create Lectures and Attendance
            $lectures = $this->createLectures($profile, $grades);
            $this->createAttendance($lectures, $students, $faker);
            
            // 7. Create Exams with Questions
            $exams = $this->createExamsWithQuestions($profile, $grades, $faker);
            
            // 8. Create Exam Attempts and Results
            $this->createExamAttempts($exams, $students, $faker);
            
            // 9. Create Gamification System
            $this->createGamification($profile, $students);
            
            // 10. Create Payments
            $this->createPayments($profile, $students, $faker);
            
            // 11. Create Failed Questions
            $this->createFailedQuestions($profile, $students, $exams);
        }
        
        // 12. Create Activity Logs (Global/Mixed)
        $this->createActivityLogs($students);

        $this->command->info('✅ All data generated successfully!');
        $this->printSummary();
    }

    private function createTeachers(): array
    {
        $this->command->info('👨‍🏫 Creating 3 Teachers...');
        
        $teachers = [];
        for ($i = 1; $i <= 3; $i++) {
            $teachers[] = Teacher::firstOrCreate(
                ['phone' => "0100000000$i"],
                [
                    'name' => "Teacher $i",
                    'password' => Hash::make('password'),
                ]
            );
        }
        return $teachers;
    }

    private function createStudents(): array
    {
        $this->command->info('👨‍🎓 Creating 10 Students...');
        
        // Realistic parent names
        $parentNames = [
            'عبدالرحمن عبد علي',
            'محمد أحمد حسن',
            'فاطمة محمود',
            'أحمد علي محمد',
            'نورا حسن',
            'خالد عبدالله',
            'سارة إبراهيم',
            'عمر يوسف',
            'مريم سعيد',
            'حسام الدين'
        ];
        
        $students = [];
        for ($i = 1; $i <= 10; $i++) {
            $pad = str_pad((string)$i, 2, '0', STR_PAD_LEFT);
            $parentPhone = "011123456$pad";
            
            // Create or get guardian with realistic name
            $guardian = Guardian::firstOrCreate(
                ['phone' => $parentPhone],
                [
                    'name' => $parentNames[$i - 1],
                    'password' => Hash::make('password'),
                ]
            );
            
            // Create student linked to guardian
            $students[] = Student::firstOrCreate(
                ['phone' => "010123456$pad"],
                [
                    'name' => "Student $i",
                    'password' => Hash::make('password'),
                    'parent_phone' => $parentPhone,
                    'guardian_id' => $guardian->id,
                ]
            );
        }
        return $students;
    }

    private function createSecretaries(TeacherProfile $profile): void
    {
        static $secCounter = 1;
        $secPhone = "012" . str_pad((string)$secCounter++, 8, '0', STR_PAD_LEFT);
        Secretary::firstOrCreate(
            ['phone' => $secPhone, 'teacher_profile_id' => $profile->id],
            [
                'name' => "Secretary for {$profile->display_name}",
                'password' => Hash::make('password'),
            ]
        );
    }

    private function createGrades(TeacherProfile $profile): array
    {
        $gradeNames = ['1st Secondary', '2nd Secondary', '3rd Secondary'];
        $grades = [];
        
        foreach ($gradeNames as $name) {
            $grades[] = Grade::firstOrCreate(
                ['name' => $name, 'teacher_profile_id' => $profile->id]
            );
        }
        return $grades;
    }

    private function createGroups(TeacherProfile $profile, array $grades): array
    {
        $groups = [];
        foreach ($grades as $grade) {
            $groups[] = Group::firstOrCreate(
                ['name' => "Group A - {$grade->name}", 'teacher_profile_id' => $profile->id, 'grade_id' => $grade->id]
            );
        }
        return $groups;
    }

    private function enrollStudents(TeacherProfile $profile, array $students, array $grades, array $groups): void
    {
        foreach ($students as $i => $student) {
            // Distribute students across grades/groups cyclically
            $gradeIndex = $i % count($grades);
            $groupIndex = $i % count($groups);
            
            Enrollment::firstOrCreate(
                ['student_id' => $student->id, 'teacher_profile_id' => $profile->id],
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
    }

    private function createLectures(TeacherProfile $profile, array $grades): array
    {
        $lectures = [];
        
        // Past lectures
        for ($i = 1; $i <= 3; $i++) {
            $date = Carbon::now()->subDays($i * 3);
            $lectures[] = Lecture::firstOrCreate(
                ['title' => "Lecture $i - Physics", 'teacher_profile_id' => $profile->id],
                [
                    'description' => "Chapter $i explanation",
                    'grade_id' => $grades[array_rand($grades)]->id,
                    'start_time' => $date->copy()->setHour(10),
                    'end_time' => $date->copy()->setHour(12),
                ]
            );
        }
        
        // Upcoming lectures
        for ($i = 1; $i <= 2; $i++) {
            $date = Carbon::now()->addDays($i * 2);
            $lectures[] = Lecture::firstOrCreate(
                ['title' => "Upcoming Lecture $i", 'teacher_profile_id' => $profile->id],
                [
                    'description' => 'New topic',
                    'grade_id' => $grades[array_rand($grades)]->id,
                    'start_time' => $date->copy()->setHour(14),
                    'end_time' => $date->copy()->setHour(16),
                ]
            );
        }
        
        return $lectures;
    }

    private function createAttendance(array $lectures, array $students, $faker): void
    {
        foreach ($lectures as $lecture) {
            foreach ($students as $student) {
                if (rand(0, 10) > 2) { // 80% attendance
                    Attendance::firstOrCreate(
                        ['lecture_id' => $lecture->id, 'student_id' => $student->id],
                        ['status' => $faker->randomElement(['present', 'present', 'present', 'late'])]
                    );
                }
            }
        }
    }

    private function createExamsWithQuestions(TeacherProfile $profile, array $grades, $faker): array
    {
        $exams = [];
        
        foreach ($grades as $index => $grade) {
            $exam = Exam::firstOrCreate(
                ['title' => "Monthly Exam - {$grade->name}", 'teacher_profile_id' => $profile->id],
                [
                    'subject' => 'Physics',
                    'max_score' => 50,
                    'duration' => 30,
                    'grade_id' => $grade->id,
                    'date' => Carbon::now()->subDays($index * 5),
                    'is_active' => true,
                    'actual_question_count' => 5,
                    'time_per_question' => 60,
                ]
            );
            
            // Add questions
            for ($q = 1; $q <= 5; $q++) {
                Question::firstOrCreate(
                    ['exam_id' => $exam->id, 'text' => "Question $q for Exam " . ($index + 1)],
                    [
                        'options' => json_encode(['Option A', 'Option B', 'Option C', 'Option D']),
                        'correct_answer' => $faker->randomElement(['Option A', 'Option B', 'Option C', 'Option D']),
                    ]
                );
            }
            
            $exams[] = $exam;
        }
        
        return $exams;
    }

    private function createExamAttempts(array $exams, array $students, $faker): void
    {
        foreach ($exams as $exam) {
            $questions = Question::where('exam_id', $exam->id)->get();
            $questionIds = $questions->pluck('id')->toArray();
            
            // Only first 5 students attempt exams
            foreach (array_slice($students, 0, 5) as $student) {
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
                
                $correctCount = 0;
                foreach ($questions as $question) {
                    $isCorrect = rand(0, 1) ? true : false;
                    if ($isCorrect) $correctCount++;
                    
                    StudentAnswer::firstOrCreate(
                        ['exam_attempt_id' => $attempt->id, 'question_id' => $question->id],
                        [
                            'answer' => $faker->randomElement(['Option A', 'Option B']),
                            'is_correct' => $isCorrect,
                            'answered_at' => Carbon::now()->subHours(rand(1, 48)),
                        ]
                    );
                }
                
                $score = ($correctCount / max(count($questions), 1)) * $exam->max_score;
                ExamResult::firstOrCreate(
                    ['exam_id' => $exam->id, 'student_id' => $student->id],
                    ['score' => round($score)]
                );
            }
        }
    }

    private function createGamification(TeacherProfile $profile, array $students): void
    {
        GamificationSetting::firstOrCreate(
            ['teacher_profile_id' => $profile->id],
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
        
        foreach ($students as $student) {
            StudentPoint::firstOrCreate(
                ['student_id' => $student->id, 'teacher_profile_id' => $profile->id],
                [
                    'total_points' => rand(50, 500),
                    'attendance_streak' => rand(0, 10),
                ]
            );
            
            PointTransaction::firstOrCreate(
                ['student_id' => $student->id, 'teacher_profile_id' => $profile->id, 'type' => 'attendance'],
                [
                    'points' => 10,
                    'description' => 'Lecture Attendance',
                ]
            );
        }
    }

    private function createPayments(TeacherProfile $profile, array $students, $faker): void
    {
        $statuses = ['pending', 'confirmed', 'expired'];
        
        foreach (array_slice($students, 0, 3) as $index => $student) {
            $enrollment = Enrollment::where('student_id', $student->id)
                ->where('teacher_profile_id', $profile->id)
                ->first();
            
            if (!$enrollment) continue;
            
            PaymentLog::firstOrCreate(
                ['student_id' => $student->id, 'teacher_profile_id' => $profile->id, 'confirmation_code' => 'TEST-' . substr((string)$profile->id, 0, 8) . '-' . $index],
                [
                    'enrollment_id' => $enrollment->id,
                    'client_side_uuid' => $faker->uuid(),
                    'amount' => rand(100, 300),
                    'status' => $statuses[$index % 3],
                    'payment_method' => 'cash',
                    'expires_at' => Carbon::now()->addDays(7),
                    'confirmed_at' => $statuses[$index % 3] === 'confirmed' ? Carbon::now() : null,
                    'received_by_type' => 'App\\Domains\\Auth\\Models\\TeacherProfile',
                    'received_by_id' => $profile->id,
                ]
            );
        }
    }

    private function createFailedQuestions(TeacherProfile $profile, array $students, array $exams): void
    {
        foreach (array_slice($students, 0, 3) as $student) {
            foreach ($exams as $exam) {
                $questions = Question::where('exam_id', $exam->id)->take(2)->get();
                
                foreach ($questions as $question) {
                    FailedQuestion::firstOrCreate(
                        ['student_id' => $student->id, 'question_id' => $question->id],
                        [
                            'teacher_profile_id' => $profile->id,
                            'exam_id' => $exam->id,
                            'student_answer' => 'Option A',
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
        $actions = ['enrolled', 'payment', 'status_change'];
        
        foreach (array_slice($students, 0, 5) as $student) {
            $enrollment = Enrollment::where('student_id', $student->id)->first();
            if (!$enrollment) continue;
            
            foreach ($actions as $action) {
                StudentActivityLog::firstOrCreate(
                    ['student_id' => $student->id, 'action' => $action, 'enrollment_id' => $enrollment->id],
                    [
                        'data' => json_encode(['note' => "Student performed: $action"]),
                        'performed_by_type' => 'App\\Domains\\Auth\\Models\\TeacherProfile',
                        'performed_by_id' => $enrollment->teacher_profile_id,
                    ]
                );
            }
        }
    }

    private function printSummary(): void
    {
        $this->command->info('');
        $this->command->info('📊 Seeding Summary:');
        $this->command->info('========================');
        $this->command->info('👨‍🏫 Teachers: ' . Teacher::count());
        $this->command->info('👨‍🏫 Teacher Profiles: ' . TeacherProfile::count());
        $this->command->info('👩‍💼 Secretaries: ' . Secretary::count());
        $this->command->info('👨‍🎓 Students: ' . Student::count());
        $this->command->info('📝 Enrollments: ' . Enrollment::count());
        $this->command->info('========================');
        $this->command->info('');
        $this->command->info('🔑 Credentials (Password: password):');
        $this->command->info('   Admin: admin');
        $this->command->info('   Teachers: teacher1, teacher2, teacher3');
        $this->command->info('   Students: student1 (01012345601) ... student10 (01012345610)');
    }
}
