<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Subscriptions\Models\Subscription;

final class AcademySubscriptionQueries
{
    public function getCurrentPlan(Academy $academy): array
    {
        $planType = $academy->plan_type ?? 'free';
        $maxStudents = $academy->plan_max_students;
        $isUnlimited = $academy->is_unlimited_students;
        $fee = $academy->subscription_fee;

        $planNames = [
            'free' => 'الباقة المجانية',
            'basic' => 'الباقة الأساسية',
            'standard' => 'الباقة القياسية',
            'premium' => 'الباقة المميزة',
        ];

        return [
            'plan_name' => $planNames[$planType] ?? $planType,
            'plan_price' => (float) ($fee ?? 0),
            'student_limit' => $isUnlimited ? -1 : ($maxStudents ?? 0),
            'is_unlimited' => $isUnlimited ?? false,
        ];
    }

    public function getUsedSlots(Academy $academy): int
    {
        return Enrollment::where('academy_id', $academy->id)
            ->where('is_active', true)
            ->distinct('student_id')
            ->count('student_id');
    }

    public function getUsagePercentage(Academy $academy): float
    {
        $plan = $this->getCurrentPlan($academy);

        if ($plan['is_unlimited'] || $plan['student_limit'] <= 0) {
            return 0.0;
        }

        $used = $this->getUsedSlots($academy);

        return round(($used / $plan['student_limit']) * 100, 2);
    }

    public function getRenewalDate(Academy $academy): ?string
    {
        $expiresAt = $academy->plan_expires_at;

        return $expiresAt?->toDateString();
    }

    public function getSubscriptionStatus(Academy $academy): string
    {
        $latestSubscription = $academy->latestSubscription;

        if ($latestSubscription) {
            return $latestSubscription->status->value;
        }

        if ($academy->plan_expires_at && $academy->plan_expires_at->isFuture()) {
            return 'active';
        }

        return 'free';
    }

    public function getFullSubscriptionUsage(Academy $academy): array
    {
        $plan = $this->getCurrentPlan($academy);
        $used = $this->getUsedSlots($academy);
        $percentage = $plan['is_unlimited'] ? 0.0 : (
            $plan['student_limit'] > 0
                ? round(($used / $plan['student_limit']) * 100, 2)
                : 0.0
        );

        return [
            'plan_name' => $plan['plan_name'],
            'plan_price' => $plan['plan_price'],
            'student_limit' => $plan['student_limit'],
            'used_slots' => $used,
            'usage_percentage' => $percentage,
            'renewal_date' => $this->getRenewalDate($academy),
            'subscription_status' => $this->getSubscriptionStatus($academy),
        ];
    }
}
