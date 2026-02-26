<?php

declare(strict_types=1);

namespace App\Domains\Auth\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademySecretaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'avatar' => $this->avatar_url,
            'avatar_key' => $this->avatar_key,
            'is_active' => $this->when(
                $this->relationLoaded('pivot'),
                fn() => $this->pivot->is_active ?? $this->is_active
            ),
            'permissions' => $this->when(
                $this->relationLoaded('pivot'),
                fn() => $this->pivot->permissions ?? []
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
