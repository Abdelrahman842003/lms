<?php

namespace Database\Factories;

use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Auth\Models\TeacherProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

class GamificationSettingFactory extends Factory
{
    protected $model = GamificationSetting::class;

    public function definition(): array
    {
        return [
            'teacher_profile_id' => TeacherProfile::factory(),
            'attendance_points' => 10,
            'is_enabled' => true,
        ];
    }
}
