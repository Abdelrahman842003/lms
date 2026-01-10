<?php

declare(strict_types=1);

namespace App\Http\Resources\Academy;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'teacher' => $this->whenLoaded('teacher', fn() => [
                'id' => $this->teacher->id,
                'name' => $this->teacher->name,
                'phone' => $this->teacher->phone,
            ]),
            'date' => $this->date?->toDateString(),
            'checked_in_at' => $this->checked_in_at?->toISOString(),
            'checked_out_at' => $this->checked_out_at?->toISOString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'duration_minutes' => $this->duration_minutes,
            'duration_formatted' => $this->duration_formatted,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
