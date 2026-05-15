<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Academy;

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
            // Subscription fields
            'plan_type' => $this->plan_type,
            'plan_expires_at' => $this->plan_expires_at,
            'plan_max_students' => $this->plan_max_students,
            'is_unlimited_students' => (bool) $this->is_unlimited_students,
            'has_videos_addon' => (bool) $this->has_videos_addon,
            'subscription_fee' => $this->subscription_fee ?? 0,
            'paid_amount' => $this->paid_amount ?? 0,
            'trial_period_days' => $this->trial_period_days !== null ? (int) $this->trial_period_days : null,
            'effective_trial_period_days' => $this->trial_period_days !== null
                ? (int) $this->trial_period_days
                : (int) \App\Domains\Application\Models\Setting::getValue('trial_period_days', 14),
            // Quota fields (Minutes-based for video, bytes for attachments)
            'storage_minutes_limit' => $this->storage_minutes_limit,
            'storage_minutes_used' => $this->storage_minutes_used,
            'delivery_minutes_limit' => $this->delivery_minutes_limit,
            'delivery_minutes_used' => $this->delivery_minutes_used,
            'storage_used_bytes' => (int) $this->storage_used_bytes,
            
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
