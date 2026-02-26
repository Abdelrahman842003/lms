<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Subscriptions\Models\TeacherSubscription;
use App\Domains\Subscriptions\Models\AcademySubscription;

/**
 * Specification: هل المشترك (مدرس أو منظمة) لديه مقاعد متاحة؟
 */
final class SeatAvailable
{
    /**
     * @param  int    $subscriberId   ID الـ teacher أو academy
     * @param  string $subscriberType 'teacher' | 'academy'
     */
    public function isSatisfiedBy(int $subscriberId, string $subscriberType = 'teacher'): bool
    {
        if ($subscriberType === 'teacher') {
            $sub = TeacherSubscription::where('teacher_id', $subscriberId)
                ->where('status', 'active')
                ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                ->first();

            if (! $sub) {
                return false;
            }

            return $sub->max_students === null || $sub->used_seats < $sub->max_students;
        }

        if ($subscriberType === 'academy') {
            $sub = AcademySubscription::where('academy_id', $subscriberId)
                ->where('status', 'active')
                ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                ->first();

            if (! $sub) {
                return false;
            }

            return $sub->max_students === null || $sub->used_seats < $sub->max_students;
        }

        return false;
    }
}
