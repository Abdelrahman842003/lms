<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Teacher;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\Question;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * Seeder لاختبار منع تعارض الامتحانات
 * يُنشئ مدرسين لهم طلاب مشتركين
 */
class ExamConflictTestSeeder extends Seeder
{
    public function run(): void
    {
        // إنشاء مدرسين
        $teacher1 = Teacher::firstOrCreate(
            ['phone' => '01000000001'],
            [
                'name' => 'أحمد محمد',
                'password' => Hash::make('password'),
            ]
        );

        $teacher2 = Teacher::firstOrCreate(
            ['phone' => '01000000002'],
            [
                'name' => 'محمد علي',
                'password' => Hash::make('password'),
            ]
        );

        $this->command->info("✅ تم إنشاء المدرسين:");
        $this->command->info("   - {$teacher1->name} (هاتف: {$teacher1->phone})");
        $this->command->info("   - {$teacher2->name} (هاتف: {$teacher2->phone})");
        $this->command->info("   الباسورد: password");

        // إنشاء صف مشترك لكل مدرس
        $grade1 = Grade::firstOrCreate(
            ['name' => 'الصف الأول الثانوي', 'teacher_id' => $teacher1->id]
        );

        $grade2 = Grade::firstOrCreate(
            ['name' => 'الصف الأول الثانوي', 'teacher_id' => $teacher2->id]
        );

        // إنشاء مجموعات
        $group1 = Group::firstOrCreate(
            ['name' => 'مجموعة أ', 'teacher_id' => $teacher1->id, 'grade_id' => $grade1->id]
        );

        $group2 = Group::firstOrCreate(
            ['name' => 'مجموعة أ', 'teacher_id' => $teacher2->id, 'grade_id' => $grade2->id]
        );

        // إنشاء طلاب مشتركين عند المدرسين
        $sharedStudents = [];
        for ($i = 1; $i <= 5; $i++) {
            $student = Student::firstOrCreate(
                ['phone' => "0111111111{$i}"],
                [
                    'name' => "طالب مشترك {$i}",
                    'password' => Hash::make('password'),
                ]
            );
            $sharedStudents[] = $student;

            // تسجيل الطالب عند المدرس الأول
            Enrollment::firstOrCreate(
                ['student_id' => $student->id, 'teacher_id' => $teacher1->id],
                [
                    'grade_id' => $grade1->id,
                    'group_id' => $group1->id,
                    'balance' => 0,
                    'is_active' => true,
                    'subscription_start' => Carbon::now(),
                    'subscription_end' => Carbon::now()->addMonth(),
                ]
            );

            // تسجيل الطالب عند المدرس الثاني
            Enrollment::firstOrCreate(
                ['student_id' => $student->id, 'teacher_id' => $teacher2->id],
                [
                    'grade_id' => $grade2->id,
                    'group_id' => $group2->id,
                    'balance' => 0,
                    'is_active' => true,
                    'subscription_start' => Carbon::now(),
                    'subscription_end' => Carbon::now()->addMonth(),
                ]
            );
        }

        $this->command->info("✅ تم إنشاء 5 طلاب مشتركين عند المدرسين");

        // إنشاء امتحان لكل مدرس في نفس التاريخ
        $examDate = Carbon::tomorrow();

        $exam1 = Exam::create([
            'teacher_id' => $teacher1->id,
            'title' => 'امتحان الفصل الأول',
            'subject' => 'رياضيات',
            'max_score' => 50,
            'date' => $examDate,
            'duration' => 30,
            'grade_id' => $grade1->id,
            'actual_question_count' => 5,
            'time_per_question' => 60,
        ]);

        // إضافة أسئلة للامتحان الأول
        for ($i = 1; $i <= 5; $i++) {
            Question::create([
                'exam_id' => $exam1->id,
                'text' => "سؤال رقم {$i}",
                'options' => ['أ', 'ب', 'ج', 'د'],
                'correct_answer' => 'أ',
            ]);
        }

        $exam2 = Exam::create([
            'teacher_id' => $teacher2->id,
            'title' => 'امتحان شهري',
            'subject' => 'فيزياء',
            'max_score' => 50,
            'date' => $examDate,
            'duration' => 30,
            'grade_id' => $grade2->id,
            'actual_question_count' => 5,
            'time_per_question' => 60,
        ]);

        // إضافة أسئلة للامتحان الثاني
        for ($i = 1; $i <= 5; $i++) {
            Question::create([
                'exam_id' => $exam2->id,
                'text' => "سؤال رقم {$i}",
                'options' => ['أ', 'ب', 'ج', 'د'],
                'correct_answer' => 'أ',
            ]);
        }

        $this->command->info("✅ تم إنشاء امتحانين في نفس التاريخ ({$examDate->format('Y-m-d')})");
        $this->command->info("");
        $this->command->info("🧪 لاختبار منع التعارض:");
        $this->command->info("   1. سجل دخول كـ {$teacher1->phone}");
        $this->command->info("   2. فعّل الامتحان");
        $this->command->info("   3. سجل دخول كـ {$teacher2->phone}");
        $this->command->info("   4. حاول تفعيل الامتحان → يجب أن يُرفض");
    }
}
