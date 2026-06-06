<?php

namespace Database\Factories;

use App\Domains\Auth\Models\TeacherProfile;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Enrollments\Models\Group>
 */
class GroupFactory extends Factory
{
    protected $model = Group::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word() . ' Group',
            'teacher_profile_id' => TeacherProfile::factory(),
            'grade_id' => Grade::factory(),
        ];
    }
}
