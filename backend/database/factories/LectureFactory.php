<?php

namespace Database\Factories;

use App\Models\Lecture;
use Illuminate\Database\Eloquent\Factories\Factory;

class LectureFactory extends Factory
{
    protected $model = Lecture::class;

    public function definition()
    {
        $startTime = $this->faker->dateTimeBetween('now', '+1 month');
        return [
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph,
            'start_time' => $startTime,
            'end_time' => (clone $startTime)->modify('+1 hour'),
        ];
    }
}
