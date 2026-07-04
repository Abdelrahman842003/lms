<?php

namespace Database\Factories;

use App\Domains\Auth\Models\Academy;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Auth\Models\Academy>
 */
class AcademyFactory extends Factory
{
    protected $model = Academy::class;

    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'phone' => fake()->unique()->phoneNumber(),
            'password' => static::$password ??= Hash::make('password'),
            'checkin_qr_code' => Str::random(32),
            'checkout_qr_code' => Str::random(32),
            'is_active' => true,
            'plan_type' => 'trial',
        ];
    }
}
