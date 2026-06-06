<?php

namespace Database\Factories;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\TeacherProfile;
use App\Domains\Auth\Models\Academy;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Auth\Models\TeacherProfile>
 */
class TeacherProfileFactory extends Factory
{
    protected $model = TeacherProfile::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'teacher_id' => Teacher::factory(),
            'academy_id' => null,
            'type' => 'independent',
            'display_name' => fake()->name(),
            'slug' => fake()->unique()->slug(),
            'status' => 'ACTIVE',
        ];
    }

    public function academy(Academy $academy = null)
    {
        return $this->state(fn (array $attributes) => [
            'academy_id' => $academy ? $academy->id : Academy::factory(),
            'type' => 'academy',
        ]);
    }
}
