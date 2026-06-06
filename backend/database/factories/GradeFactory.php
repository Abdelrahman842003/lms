<?php

namespace Database\Factories;

use App\Domains\Auth\Models\TeacherProfile;
use App\Domains\Enrollments\Models\Grade;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Enrollments\Models\Grade>
 */
class GradeFactory extends Factory
{
    protected $model = Grade::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word() . ' Grade',
            'teacher_profile_id' => TeacherProfile::factory(),
        ];
    }
}
