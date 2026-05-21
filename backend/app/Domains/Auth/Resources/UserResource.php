<?php

declare(strict_types=1);

namespace App\Domains\Auth\Resources;

use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Student;
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
                $this->resource instanceof Admin => $this->username,
                $this->resource instanceof Teacher || $this->resource instanceof Student => $this->phone,
                default => null,
            },
            'role' => $this->when($this->resource instanceof Admin, 'admin',
                      $this->when($this->resource instanceof Teacher, 'teacher',
                      $this->when($this->resource instanceof Student, 'student', 'user'))),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
