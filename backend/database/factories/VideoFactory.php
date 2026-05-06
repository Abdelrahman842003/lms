<?php

namespace Database\Factories;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class VideoFactory extends Factory
{
    protected $model = Video::class;

    public function definition(): array
    {
        $teacher = Teacher::factory()->create();

        return [
            'owner_type' => VideoOwnerType::INDEPENDENT_TEACHER,
            'owner_id' => $teacher->id,
            'uploader_type' => Teacher::class,
            'uploader_id' => $teacher->id,
            'teacher_reference_id' => $teacher->id,
            'teacher_reference_name' => $teacher->name,
            'title' => $this->faker->sentence(),
            'status' => VideoStatus::PUBLISHED,
            'processing_status' => VideoProcessingStatus::SUCCEEDED,
            'processed_path' => 'videos/processed/' . Str::uuid() . '/master-720p.mp4',
            'duration_seconds' => $this->faker->numberBetween(60, 3600),
            'published_at' => now()->subMinute(),
        ];
    }
}
