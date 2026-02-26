<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Subscriptions\Models\TeacherSubscription;
use App\Domains\Subscriptions\Models\AcademySubscription;

/**
 * Specification: هل الباقة المرتبطة بالمشترك نشطة وغير منتهية؟
 */
final class PlanActive
{
    /**
     * @param  int    $subscriberId
     * @param  string $subscriberType 'teacher' | 'academy'
     */
    public function isSatisfiedBy(int $subscriberId, string $subscriberType = 'teacher'): bool
    {
        if ($subscriberType === 'teacher') {
            return TeacherSubscription::where('teacher_id', $subscriberId)
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
                })
                ->exists();
        }

        if ($subscriberType === 'academy') {
            return AcademySubscription::where('academy_id', $subscriberId)
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
                })
                ->exists();
        }

        return false;
    }
}
