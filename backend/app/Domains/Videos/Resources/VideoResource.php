<?php

declare(strict_types=1);

namespace App\Domains\Videos\Resources;

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VideoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'owner_type' => $this->owner_type?->value,
            'owner_id' => $this->owner_id,
            'academy_id' => $this->academy_id,
            'teacher_reference' => [
                'id' => $this->teacher_reference_id,
                'name' => $this->teacher_reference_name ?? $this->teacherReference?->name,
            ],
            'grade_id' => $this->grade_id,
            'grade' => $this->whenLoaded('grade', fn () => [
                'id' => $this->grade->id,
                'name' => $this->grade->name,
            ]),
            'groups' => $this->whenLoaded('groups', fn () => $this->groups->map(fn ($group) => [
                'id' => $group->id,
                'name' => $group->name,
            ])->values()),
            'lecture_id' => $this->lecture_id,
            'lesson_id' => $this->lesson_id,
            'status' => $this->status?->value,
            'processing_status' => $this->processing_status?->value,
            'scheduled_at' => $this->scheduled_at,
            'published_at' => $this->published_at,
            'available_from' => $this->available_from,
            'available_until' => $this->available_until,
            'duration_seconds' => $this->duration_seconds,
            'width' => $this->width,
            'height' => $this->height,
            'codec' => $this->codec,
            'frame_rate' => $this->frame_rate,
            'thumbnail_url' => $this->thumbnail_path
                ? (function () use ($request): ?string {
                    $user = $request->user();
                    if ($user instanceof Student) {
                        return url('/api/v1/student/videos/' . $this->id . '/thumbnail');
                    }
                    if ($user instanceof Teacher) {
                        return url('/api/v1/teacher/videos/' . $this->id . '/thumbnail');
                    }
                    if ($user instanceof Academy || $user instanceof Secretary) {
                        return url('/api/v1/academy/videos/' . $this->id . '/thumbnail');
                    }
                    return null;
                })()
                : null,
            'processing_error' => $this->processing_error,
            'likes_count' => $this->whenCounted('likes', (int) $this->likes_count),
            'liked_by_me' => $this->relationLoaded('likes') ? $this->likes->isNotEmpty() : null,
            'comments_count' => $this->whenCounted('comments', (int) $this->comments_count),
            'attachments_count' => $this->whenCounted('attachments', (int) $this->attachments_count),
            'watch_progresses_count' => $this->whenCounted('watchProgresses', (int) $this->watch_progresses_count),
            'attachments' => VideoAttachmentResource::collection($this->whenLoaded('attachments')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
