<?php

declare(strict_types=1);

namespace App\Http\Resources\Secretary;

use App\Http\Resources\Teacher\TeacherResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SecretaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Get all permissions from all linked teachers (unique)
        $allPermissions = [];
        if ($this->relationLoaded('teachers')) {
            foreach ($this->teachers as $teacher) {
                $pivotPermissions = $teacher->pivot->permissions ?? [];
                if (is_string($pivotPermissions)) {
                    $pivotPermissions = json_decode($pivotPermissions, true) ?? [];
                }
                $allPermissions = array_merge($allPermissions, $pivotPermissions);
            }
            $allPermissions = array_unique($allPermissions);
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'role' => 'secretary',
            'permissions' => array_values($allPermissions),
            'teachers' => $this->whenLoaded('teachers', function () {
                return $this->teachers->map(function ($teacher) {
                    $pivotPermissions = $teacher->pivot->permissions ?? [];
                    if (is_string($pivotPermissions)) {
                        $pivotPermissions = json_decode($pivotPermissions, true) ?? [];
                    }
                    return [
                        'id' => $teacher->id,
                        'name' => $teacher->name,
                        'permissions' => $pivotPermissions,
                    ];
                });
            }),
            'created_at' => $this->created_at->toIso8601String(),
            'avatar' => $this->avatar_key ? app(\App\Services\Media\ImageService::class)->getUrl($this->avatar_key) : null,
        ];
    }
}
