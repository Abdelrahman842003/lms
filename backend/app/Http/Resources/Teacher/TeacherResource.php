<?php

declare(strict_types=1);

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
            'subject' => $this->subject,
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
            'status' => (function () {
                if ($this->status === 'pending') {
                    return 'في انتظار الموافقة';
                } elseif ($this->status === 'suspended') {
                    return 'معلق';
                } elseif ($this->status === 'active') {
                    return 'نشط';
                }
                return 'غير معروف';
            })(),
            'status_key' => $this->status,
            'is_approved' => $this->status !== 'pending',
            'is_suspended' => $this->status === 'suspended',
            'is_independent_active' => (bool) $this->is_independent_active,
            'joined' => $this->created_at->format('Y-m-d'),
            'created_at' => $this->created_at->toIso8601String(),
            'subscription_fee' => (float) $this->subscription_fee,
            'paid_amount' => (float) $this->paid_amount,
            'avatar' => $this->avatar_key ? app(\App\Services\Media\ImageService::class)->getUrl($this->avatar_key) : null,
            'academies' => $this->whenLoaded('academies'),
            'independent_enrollments_count' => $this->resource->independent_enrollments_count ?? 0,
            'affiliation' => (function() {
                $academies = $this->whenLoaded('academies');
                // If academies not loaded or empty, assume independent (or check logic)
                // But here we want to be explicit.
                if ($academies instanceof \Illuminate\Database\Eloquent\Collection && $academies->isNotEmpty()) {
                     $isIndependent = $this->subscription_fee > 0;
                     if ($isIndependent) {
                         return 'both';
                     }
                     return 'academy';
                }
                return 'independent';
            })(),
            'subscription_status' => (function() {
                if ($this->relationLoaded('subscriptions')) {
                    $subscription = $this->subscriptions->first();
                    return $subscription ? $subscription->status : 'pending';
                }
                return 'pending';
            })(),
        ];
    }
}
