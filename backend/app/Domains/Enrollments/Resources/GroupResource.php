<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'grade_id' => $this->grade_id,
            'grade_name' => $this->whenLoaded('grade', fn() => $this->grade->name),
            'time' => $this->time,
            'days' => $this->days,
            'type' => $this->type,
            'price' => $this->price,
            'students_count' => $this->enrollments_count,
            'teacher' => $this->whenLoaded('teacher', function () {
                return [
                    'id' => $this->teacher->id,
                    'name' => $this->teacher->name,
                    'avatar' => $this->teacher->avatar,
                ];
            }),
            'created_at' => $this->created_at,
        ];
    }
}
