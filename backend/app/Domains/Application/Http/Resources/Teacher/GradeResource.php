<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Teacher;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => (float) $this->price,
            'groups_count' => (int) ($this->groups_count ?? 0),
            'students_count' => (int) ($this->enrollments_count ?? 0),
            'teacher_id' => $this->teacher_id,
            'teacher' => $this->whenLoaded('teacher', fn() => [
                'id' => $this->teacher->id,
                'name' => $this->teacher->name,
                'avatar' => $this->teacher->avatar,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
