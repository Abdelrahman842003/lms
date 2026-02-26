<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Academy;
use App\Models\Secretary;
use App\Models\Teacher;
use App\Domains\Support\Models\TeacherAttendanceLog;
use App\Domains\Notifications\Models\AcademyNotification;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Illuminate\Support\Str;

class NajahAcademySeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Creating Al-Najah Educational Academy test data...');

        // 1. Create Academy
        $academy = Academy::firstOrCreate(
            ['name' => 'أكاديمية النجاح التعليمية'],
            [
                'phone' => '01000000000',
                'password' => Hash::make('123456'),
                'is_active' => true,
                'billing_notes' => 'أكاديمية تجريبية',
            ]
        );

        $this->command->info("Academy ID: {$academy->id}");

        // 2. Create Teachers
        $teachersData = [
            ['name' => 'أحمد محمد', 'phone' => '01010101010'],
            ['name' => 'سارة علي', 'phone' => '01020202020'],
            ['name' => 'محمد حسن', 'phone' => '01030303030'],
            ['name' => 'منى محمود', 'phone' => '01040404040'],
            ['name' => 'خالد إبراهيم', 'phone' => '01050505050'],
        ];

        $teachers = [];
        foreach ($teachersData as $tData) {
            $teacher = Teacher::firstOrCreate(
                ['phone' => $tData['phone']],
                [
                    'name' => $tData['name'],
                    'password' => Hash::make('123456'),
                    'is_suspended' => false,
                ]
            );
            $teachers[] = $teacher;

            // Attach to academy if not already attached
            if (!$academy->teachers()->where('teacher_id', $teacher->id)->exists()) {
                $academy->teachers()->attach($teacher->id, [
                    'is_active' => true,
                    'joined_at' => Carbon::now(),
                ]);
            }
        }

        $this->command->info('Created/Linked 5 teachers');

        // 3. Create Secretaries
        $secretariesData = [
            ['name' => 'سكرتير النجاح 1', 'phone' => '01111111111'],
            ['name' => 'سكرتير النجاح 2', 'phone' => '01222222222'],
        ];

        $secretaries = [];
        foreach ($secretariesData as $sData) {
            $secretary = Secretary::firstOrCreate(
                ['phone' => $sData['phone']],
                [
                    'name' => $sData['name'],
                    'password' => Hash::make('123456'),
                    'is_active' => true,
                ]
            );
            $secretaries[] = $secretary;

            // Attach to academy
            if (!$academy->secretaries()->where('secretary_id', $secretary->id)->exists()) {
                $permissions = $secretary->phone === '01111111111' 
                    ? ['view students', 'create students', 'view teachers'] 
                    : ['view reports', 'send notifications', 'manage attendance'];

                $academy->secretaries()->attach($secretary->id, [
                    'permissions' => json_encode($permissions),
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('Created/Linked 2 secretaries');

        // 4. Create Attendance Logs (Past 7 days)
        $this->command->info('Generating attendance logs...');
        foreach ($teachers as $teacher) {
            for ($i = 0; $i < 7; $i++) {
                $date = Carbon::today()->subDays($i);
                
                if (TeacherAttendanceLog::forAcademy($academy->id)
                    ->forTeacher($teacher->id)
                    ->whereDate('date', $date)
                    ->exists()) {
                    continue;
                }

                // Random attendance pattern
                $rand = rand(1, 10);
                if ($rand <= 7) { // 70% present
                    $checkIn = $date->copy()->setTime(rand(8, 10), rand(0, 59));
                    $checkOut = $date->copy()->setTime(rand(14, 16), rand(0, 59));
                    
                    TeacherAttendanceLog::create([
                        'academy_id' => $academy->id,
                        'teacher_id' => $teacher->id,
                        'date' => $date,
                        'checked_in_at' => $checkIn,
                        'checked_out_at' => $checkOut,
                        'status' => 'checked_out',
                        'notes' => 'حضور منتظم',
                    ]);
                } elseif ($rand <= 9) { // 20% absent
                    TeacherAttendanceLog::create([
                        'academy_id' => $academy->id,
                        'teacher_id' => $teacher->id,
                        'date' => $date,
                        'status' => 'absent',
                        'notes' => 'غياب بدون عذر',
                    ]);
                }
                // 10% no record (weekend or day off)
            }
        }

        // 5. Create Notifications
        $this->command->info('Creating notifications...');
        $notifications = [
            [
                'title' => 'مرحباً بكم في أكاديمية النجاح',
                'message' => 'نرحب بجميع المدرسين والطلاب في العام الدراسي الجديد.',
                'type' => 'success',
                'target_type' => 'all',
            ],
            [
                'title' => 'تنبيه هام بخصوص الحضور',
                'message' => 'يرجى الالتزام بمواعيد الحضور والانصراف وتسجيلها عبر QR Code.',
                'type' => 'warning',
                'target_type' => 'teachers',
            ],
            [
                'title' => 'اجتماع إداري',
                'message' => 'اجتماع للسكرتارية يوم الخميس القادم لمناقشة التقارير الشهرية.',
                'type' => 'info',
                'target_type' => 'secretaries',
            ],
            [
                'title' => 'عطل فني في المصعد',
                'message' => 'يرجى استخدام السلالم لوجود صيانة في المصعد.',
                'type' => 'danger',
                'target_type' => 'all',
            ],
        ];

        foreach ($notifications as $nData) {
            AcademyNotification::create([
                'academy_id' => $academy->id,
                'created_by' => $secretaries[0]->id,
                'title' => $nData['title'],
                'message' => $nData['message'],
                'type' => $nData['type'],
                'target_type' => $nData['target_type'],
            ]);
        }

        $this->command->info('Seeding completed for Al-Najah Academy!');
        $this->command->info("Login Phone: {$academy->phone}");
        $this->command->info("Login Password: 123456");
    }
}
