<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Application\Models\Setting;
use Illuminate\Database\Seeder;

class GamificationSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            ['key' => 'gamification_is_enabled', 'value' => '1', 'group' => 'gamification'],
            ['key' => 'gamification_show_leaderboard', 'value' => '1', 'group' => 'gamification'],
            ['key' => 'gamification_leaderboard_size', 'value' => '10', 'group' => 'gamification'],
            
            // Attendance Points
            ['key' => 'gamification_attendance_points', 'value' => '10', 'group' => 'gamification'],
            ['key' => 'gamification_perfect_month_bonus', 'value' => '100', 'group' => 'gamification'],
            
            // Exam Points
            ['key' => 'gamification_exam_max_points', 'value' => '50', 'group' => 'gamification'],
            ['key' => 'gamification_exam_first_place_bonus', 'value' => '25', 'group' => 'gamification'],
            ['key' => 'gamification_exam_retake_bonus', 'value' => '20', 'group' => 'gamification'],
            ['key' => 'gamification_exam_fail_deduction', 'value' => '10', 'group' => 'gamification'],
            ['key' => 'gamification_exam_passing_percentage', 'value' => '50', 'group' => 'gamification'],

            // Question Points (Bank / Self-Test)
            ['key' => 'gamification_streak_5_bonus', 'value' => '25', 'group' => 'gamification'],
            ['key' => 'gamification_streak_10_bonus', 'value' => '75', 'group' => 'gamification'],
            
            // Videos
            ['key' => 'gamification_video_watch_points', 'value' => '15', 'group' => 'gamification'],
            ['key' => 'gamification_video_quiz_max_points', 'value' => '30', 'group' => 'gamification'],
            ['key' => 'gamification_video_quiz_perfect_bonus', 'value' => '10', 'group' => 'gamification'],
            ['key' => 'gamification_video_first_watch_bonus', 'value' => '5', 'group' => 'gamification'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        $this->command->info('Gamification settings seeded.');
        
        // Also call the levels seeder if it exists
        if (class_exists(GamificationLevelSeeder::class)) {
            $this->call(GamificationLevelSeeder::class);
        }
    }
}
