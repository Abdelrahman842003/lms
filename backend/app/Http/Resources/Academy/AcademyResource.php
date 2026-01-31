<?php

declare(strict_types=1);

namespace App\Http\Resources\Academy;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'logo_key' => $this->logo_key,
            'is_active' => $this->is_active,
            'checkin_qr_code' => $this->checkin_qr_code,
            'checkout_qr_code' => $this->checkout_qr_code,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Relationships
            'secretaries' => $this->whenLoaded('secretaries'),
            'teachers' => $this->whenLoaded('teachers'),
            
            // Counts
            'secretaries_count' => $this->whenCounted('secretaries'),
            'teachers_count' => $this->whenCounted('teachers'),
            'total_students_count' => $this->when(
                $this->relationLoaded('teachers'),
                fn() => $this->total_students_count
            ),
        ];
    }
}
