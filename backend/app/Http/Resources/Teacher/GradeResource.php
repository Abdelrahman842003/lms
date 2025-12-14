<?php

namespace App\Http\Resources\Teacher;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'groups_count' => $this->groups_count,
            'students_count' => $this->enrollments_count,
            'created_at' => $this->created_at,
        ];
    }
}
