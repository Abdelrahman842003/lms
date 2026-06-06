<?php

namespace Database\Factories;

use App\Domains\Auth\Models\TeacherProfile;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Lectures\Models\Lecture;
use Illuminate\Database\Eloquent\Factories\Factory;

class LectureFactory extends Factory
{
    protected $model = Lecture::class;

    public function definition()
    {
        $startTime = $this->faker->dateTimeBetween('now', '+1 month');
        return [
            'teacher_profile_id' => TeacherProfile::factory(),
            'grade_id' => Grade::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph,
            'start_time' => $startTime,
            'end_time' => (clone $startTime)->modify('+1 hour'),
            'is_active' => true,
        ];
    }
}
