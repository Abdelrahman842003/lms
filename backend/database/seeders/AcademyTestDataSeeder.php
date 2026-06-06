<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Notifications\Models\AcademyNotification;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AcademyTestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Get first academy (or create if none exists)
        $academy = Academy::first();
        
        if (!$academy) {
            $this->command->error('No academy found. Please run AcademySeeder first.');
            return;
        }

        $this->command->info("Adding test data for academy: {$academy->name}");

        // Create secretaries
        $secretary1 = Secretary::firstOrCreate(
            ['phone' => '01111111111'],
            [
                'name' => 'سكرتير تجريبي 1',
                'password' => Hash::make('123456'),
                'is_active' => true,
            ]
        );

        $secretary2 = Secretary::firstOrCreate(
            ['phone' => '01222222222'],
            [
                'name' => 'سكرتير تجريبي 2',
                'password' => Hash::make('123456'),
                'is_active' => true,
            ]
        );

        // Attach secretaries to academy
        if (!$academy->secretaries()->where('secretary_id', $secretary1->id)->exists()) {
            $academy->secretaries()->attach($secretary1->id, [
                'permissions' => json_encode(['view students', 'create students']),
                'is_active' => true,
            ]);
        }

        if (!$academy->secretaries()->where('secretary_id', $secretary2->id)->exists()) {
            $academy->secretaries()->attach($secretary2->id, [
                'permissions' => json_encode(['view reports', 'send notifications']),
                'is_active' => true,
            ]);
        }

        $this->command->info('Created 2 secretaries');



        // Create notifications
        $this->command->info('Creating notifications...');
        
        $notifications = [
            [
                'title' => 'إشعار عام للجميع',
                'message' => 'هذا إشعار تجريبي لجميع المستخدمين في الأكاديمية',
                'type' => 'info',
                'target_type' => 'all',
            ],
            [
                'title' => 'إشعار هام للمدرسين',
                'message' => 'يرجى من جميع المدرسين مراجعة الجدول الجديد',
                'type' => 'warning',
                'target_type' => 'teachers',
            ],
            [
                'title' => 'تحديث النظام',
                'message' => 'تم تحديث النظام بنجاح، يرجى تسجيل الدخول مرة أخرى',
                'type' => 'success',
                'target_type' => 'secretaries',
            ],
            [
                'title' => 'إشعار عاجل',
                'message' => 'هناك اجتماع طارئ اليوم الساعة 3 مساءً',
                'type' => 'danger',
                'target_type' => 'all',
            ],
        ];

        foreach ($notifications as $notificationData) {
            AcademyNotification::create([
                'academy_id' => $academy->id,
                'created_by' => $secretary1->id,
                ...$notificationData,
            ]);
        }

        $this->command->info('Created 4 notifications');
        $this->command->info('✓ Test data seeding completed successfully!');
    }
}
