<?php

namespace App\Http\Resources\Secretary;

use App\Http\Resources\Teacher\TeacherResource;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SecretaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'role' => 'secretary',
            'permissions' => $this->permissions,
            'teacher' => new TeacherResource($this->whenLoaded('teacher')),
            'created_at' => $this->created_at->toIso8601String(),
            'avatar' => $this->avatar_key ? app(\App\Services\Media\ImageService::class)->getUrl($this->avatar_key) : null,
        ];
    }
}
