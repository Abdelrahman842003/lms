<?php

namespace App\Http\Resources\Student;

use App\Http\Resources\Teacher\TeacherResource;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'parent_phone' => $this->parent_phone,
            'location' => $this->location,
            'gender' => $this->gender,
            'education_type' => $this->education_type,
            'role' => 'student',
            'teacher' => new TeacherResource($this->whenLoaded('teacher')),
            'joined' => $this->created_at->format('Y-m-d'),
            'created_at' => $this->created_at->toIso8601String(),
            'avatar' => $this->avatar_key ? app(\App\Services\Media\ImageService::class)->getUrl($this->avatar_key) : null,
        ];
    }
}
