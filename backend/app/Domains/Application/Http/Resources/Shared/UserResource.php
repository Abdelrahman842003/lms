<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Shared;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'identifier' => match (true) {
                $this->resource instanceof \App\Domains\Auth\Models\Admin => $this->username,
                $this->resource instanceof \App\Domains\Auth\Models\Teacher || $this->resource instanceof \App\Domains\Auth\Models\Student => $this->phone,
                default => null,
            },
            'role' => $this->when($this->resource instanceof \App\Domains\Auth\Models\Admin, 'admin', 
                      $this->when($this->resource instanceof \App\Domains\Auth\Models\Teacher, 'teacher', 
                      $this->when($this->resource instanceof \App\Domains\Auth\Models\Student, 'student', 'user'))),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
