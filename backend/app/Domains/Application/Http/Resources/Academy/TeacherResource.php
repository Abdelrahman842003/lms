<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Academy;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Safely get values with null coalescing
        $teacherStatus = $this->status instanceof \BackedEnum ? $this->status->value : $this->status;
        $isApproved = $teacherStatus !== 'pending';
        $isSuspended = $teacherStatus === 'suspended' || $this->resource->isSubscriptionBlocked();
        $isActive = $this->pivot?->is_active ?? true;

        // Safely get students count
        try {
            $user = $request->user();
            $academyId = null;
            if ($user instanceof \App\Domains\Auth\Models\Academy) {
                $academyId = $user->id;
            } elseif ($user instanceof \App\Domains\Auth\Models\Secretary) {
                $academyId = $user->academies()->first()?->id;
            }

            if ($academyId) {
                $studentsCount = $this->activeEnrollments()
                    ->where('academy_id', $academyId)
                    ->count();
            } else {
                $studentsCount = $this->activeEnrollments()->count();
            }
        } catch (\Exception $e) {
            $studentsCount = 0;
        }
        
        // Determine status based on approval and active state
        $status = 'نشط';
        if ($teacherStatus === 'pending') {
            $status = 'قيد الانتظار';
        } elseif ($teacherStatus === 'suspended' || $this->resource->isSubscriptionBlocked()) {
            $status = 'معلق';
        } elseif (!$isActive) {
            $status = 'معلق';
        }        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'subject' => $this->subject,
            'avatar' => $this->avatar_url,
            'students_count' => $studentsCount,
            'status' => $status,
            'is_active' => (bool) $isActive,
            'is_approved' => (bool) $isApproved,
            'is_suspended' => (bool) $isSuspended,
            'joined_at' => $this->pivot?->joined_at 
                ? ($this->pivot->joined_at instanceof \Carbon\Carbon 
                    ? $this->pivot->joined_at->toIso8601String() 
                    : \Carbon\Carbon::parse($this->pivot->joined_at)->toIso8601String())
                : $this->created_at->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
