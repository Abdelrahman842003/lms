<?php

namespace App\Http\Resources\Teacher;

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
            'role' => 'teacher',
            'students_count' => $this->resource->students_count ?? 0,
            'secretaries_count' => $this->resource->secretaries_count ?? 0,
            'students' => $this->whenLoaded('students'),
            'secretaries' => $this->whenLoaded('secretaries'),
            'revenue' => (function() {
                $count = $this->resource->students_count ?? 0;
                $setting = \App\Models\Setting::where('key', 'pricePerStudent')->value('value');
                $price = is_numeric($setting) ? (float) $setting : 0;
                return $count * $price;
            })(),
            'status' => $this->is_suspended ? 'معلق' : 'نشط',
            'is_suspended' => (bool) $this->is_suspended,
            'joined' => $this->created_at->format('Y-m-d'),
            'created_at' => $this->created_at->toIso8601String(),
            'subscription_fee' => (float) $this->subscription_fee,
            'paid_amount' => (float) $this->paid_amount,
            'avatar' => $this->avatar_key ? app(\App\Services\Media\ImageService::class)->getUrl($this->avatar_key) : null,
        ];
    }
}
