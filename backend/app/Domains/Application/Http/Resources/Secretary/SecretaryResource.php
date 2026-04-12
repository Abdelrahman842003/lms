<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Secretary;

use App\Domains\Application\Http\Resources\Teacher\TeacherResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SecretaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Get all permissions from both linked teachers and academies
        $allPermissions = [];
        
        // 1. Collect from Teachers
        if ($this->relationLoaded('teachers')) {
            foreach ($this->teachers as $teacher) {
                $pivotPermissions = $teacher->pivot->permissions ?? [];
                if (is_string($pivotPermissions)) {
                    $pivotPermissions = json_decode($pivotPermissions, true) ?? [];
                }
                
                $permissionModels = \Spatie\Permission\Models\Permission::whereIn('name', $pivotPermissions)
                    ->where('guard_name', 'secretary')
                    ->get(['name', 'feature_key']);

                foreach ($permissionModels as $p) {
                    $allPermissions[] = ['name' => $p->name, 'key' => $p->feature_key];
                }
            }
        }

        // 2. Collect from Academies
        if ($this->relationLoaded('academies')) {
            foreach ($this->academies as $academy) {
                $pivotPermissions = $academy->pivot->permissions ?? [];
                if (is_string($pivotPermissions)) {
                    $pivotPermissions = json_decode($pivotPermissions, true) ?? [];
                }
                
                $permissionModels = \Spatie\Permission\Models\Permission::whereIn('name', $pivotPermissions)
                    ->where('guard_name', 'secretary')
                    ->get(['name', 'feature_key']);

                foreach ($permissionModels as $p) {
                    $allPermissions[] = ['name' => $p->name, 'key' => $p->feature_key];
                }
            }
        }
        
        // Ensure unique permissions by key
        $allPermissions = collect($allPermissions)->unique('key')->values()->toArray();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'role' => 'secretary',
            'permissions' => $allPermissions,
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
            'academies' => $this->whenLoaded('academies', function () {
                return $this->academies->map(function ($academy) {
                    $pivotPermissions = $academy->pivot->permissions ?? [];
                    if (is_string($pivotPermissions)) {
                        $pivotPermissions = json_decode($pivotPermissions, true) ?? [];
                    }
                    return [
                        'id' => $academy->id,
                        'name' => $academy->name,
                        'permissions' => $pivotPermissions,
                    ];
                });
            }),
            'created_at' => $this->created_at->toIso8601String(),
            'avatar' => $this->avatar_key ? app(\App\Domains\Media\Services\ImageService::class)->getUrl($this->avatar_key) : null,
        ];
    }
}
