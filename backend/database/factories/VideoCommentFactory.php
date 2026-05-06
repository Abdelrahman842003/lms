<?php

namespace Database\Factories;

use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoComment;
use Illuminate\Database\Eloquent\Factories\Factory;

class VideoCommentFactory extends Factory
{
    protected $model = VideoComment::class;

    public function definition(): array
    {
        return [
            'video_id' => Video::factory(),
            'author_type' => Student::class,
            'author_id' => Student::factory(),
            'body' => $this->faker->paragraph(),
            'is_hidden' => false,
        ];
    }
}
