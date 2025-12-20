<?php

namespace App\Http\Resources\Shared;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->when($this->resource instanceof \App\Models\Admin, 'admin', 
                      $this->when($this->resource instanceof \App\Models\Teacher, 'teacher', 
                      $this->when($this->resource instanceof \App\Models\Student, 'student', 'user'))),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
