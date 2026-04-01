<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;

final class TeacherSubscriptionQueryService
{
    public function planUsagePercentage(Teacher $teacher, ReportFilters $filters): float
    {
        $limit = $teacher->plan_max_students;

        if ($limit === null || $limit <= 0 || ($teacher->is_unlimited_students ?? false)) {
            return 0.0;
        }

        $used = Enrollment::where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->count();

        return round(($used / $limit) * 100, 2);
    }

    public function planDetails(Teacher $teacher, ReportFilters $filters): array
    {
        $limit = $teacher->plan_max_students;
        $isUnlimited = ($teacher->is_unlimited_students ?? false) || $limit === null || $limit <= 0;

        $usedSlots = Enrollment::where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->count();

        $usagePct = $isUnlimited ? 0.0 : $this->planUsagePercentage($teacher, $filters);

        $status = 'active';
        if ($teacher->plan_expires_at && $teacher->plan_expires_at->isPast()) {
            $status = 'expired';
        } elseif ($usagePct >= 90) {
            $status = 'near_limit';
        }

        $planName = match ($teacher->plan_type ?? 'default') {
            'basic' => 'الباقة الأساسية',
            'standard' => 'الباقة القياسية',
            'premium' => 'الباقة المميزة',
            default => 'باقة المدرس',
        };

        return [
            'plan_name' => $planName,
            'student_limit' => $isUnlimited ? null : $limit,
            'used_slots' => $usedSlots,
            'remaining_capacity' => $isUnlimited ? null : max(0, $limit - $usedSlots),
            'usage_percentage' => $usagePct,
            'renewal_date' => $teacher->plan_expires_at?->toDateString(),
            'status' => $status,
        ];
    }
}
