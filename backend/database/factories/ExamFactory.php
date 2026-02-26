<?php

namespace Database\Factories;

use App\Domains\Exams\Models\Exam;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExamFactory extends Factory
{
    protected $model = Exam::class;

    public function definition()
    {
        return [
            'title' => $this->faker->sentence(3) . ' Exam',
            'subject' => $this->faker->word,
            'max_score' => 100,
            'date' => $this->faker->date(),
            'duration' => 60,
        ];
    }
}
