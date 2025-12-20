<?php

namespace Database\Factories;

use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'password' => static::$password ??= Hash::make('password'),
            'location' => fake()->city(),
            'phone' => fake()->phoneNumber(),
            'parent_phone' => fake()->phoneNumber(),
            'gender' => fake()->randomElement(['male', 'female']),
            'education_type' => fake()->randomElement(['general', 'azhar']),
        ];
    }
}
