<?php

namespace App\Http\Resources\Teacher;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'role' => 'teacher',
            'students_count' => $this->whenCounted('students') ?? 0,
            'secretaries_count' => $this->whenCounted('secretaries') ?? 0,
            'students' => $this->whenLoaded('students'),
            'secretaries' => $this->whenLoaded('secretaries'),
            'revenue' => 0, // Placeholder
            'status' => 'نشط', // Placeholder
            'joined' => $this->created_at->format('Y-m-d'),
            'created_at' => $this->created_at->toIso8601String(),
            'avatar' => $this->avatar_key ? app(\App\Services\Media\ImageService::class)->getUrl($this->avatar_key) : null,
        ];
    }
}
