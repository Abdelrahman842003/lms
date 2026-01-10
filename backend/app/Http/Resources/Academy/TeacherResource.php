<?php

declare(strict_types=1);

namespace App\Http\Resources\Academy;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'avatar' => $this->avatar_url,
            'students_count' => $this->activeEnrollments()->count(),
            'status' => $this->pivot->is_active ? 'نشط' : 'غير نشط',
            'is_active' => (bool) $this->pivot->is_active,
            'joined_at' => $this->whenPivotLoaded('academy_teacher', function () {
                return $this->pivot->joined_at;
            }),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
