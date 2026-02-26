<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Academy;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademyStudentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $enrollments = $this->enrollments;

        $statusPriority = ['active' => 1, 'trial' => 2, 'grace_period' => 3, 'expired' => 4];
        $bestStatus = 'expired';
        $bestDaysLeft = 0;
        $bestTrialDaysLeft = null;

        foreach ($enrollments as $enrollment) {
            $enrollmentStatus = $enrollment->status ?? 'expired';
            if (($statusPriority[$enrollmentStatus] ?? 5) < ($statusPriority[$bestStatus] ?? 5)) {
                $bestStatus = $enrollmentStatus;
                $bestDaysLeft = $enrollment->days_left ?? 0;
                if ($enrollmentStatus === 'trial' && $enrollment->trial_ends_at) {
                    $bestTrialDaysLeft = max(0, now()->diffInDays($enrollment->trial_ends_at, false));
                }
            }
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'parent_phone' => $this->parent_phone,
            'avatar' => $this->avatar,
            'is_active' => $enrollments->contains('is_active', true),
            'status' => $bestStatus,
            'days_left' => $bestDaysLeft,
            'trial_days_left' => $bestTrialDaysLeft,
            'teachers_count' => $enrollments->unique('teacher_id')->count(),
            'teachers' => $enrollments->map(function ($enrollment) {
                return [
                    'id' => $enrollment->teacher_id,
                    'name' => $enrollment->teacher?->name,
                    'grade_name' => $enrollment->grade?->name,
                    'group_name' => $enrollment->group?->name,
                    'is_active' => $enrollment->is_active,
                    'subscription_end' => $enrollment->subscription_end,
                    'status' => $enrollment->status,
                    'days_left' => $enrollment->days_left,
                    'trial_ends_at' => $enrollment->trial_ends_at,
                    'trial_days_left' => $enrollment->status === 'trial' && $enrollment->trial_ends_at
                        ? max(0, now()->diffInDays($enrollment->trial_ends_at, false))
                        : null,
                ];
            })->values(),
            'group_name' => $enrollments->pluck('group.name')->filter()->unique()->implode(', '),
            'grade_name' => $enrollments->pluck('grade.name')->filter()->unique()->implode(', '),
            'created_at' => $this->created_at,
            'remaining_days' => $enrollments->where('is_active', true)
                ->filter(fn ($enrollment) => $enrollment->subscription_end && $enrollment->subscription_end->isFuture())
                ->map(fn ($enrollment) => now()->diffInDays($enrollment->subscription_end))
                ->max() ?? 0,
        ];
    }
}
