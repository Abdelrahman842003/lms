<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Subscriptions\DTOs\SubscriptionCandidate;
use App\Domains\Subscriptions\Models\TeacherSubscription;
use App\Domains\Subscriptions\Models\AcademySubscription;

/**
 * Specification: هل المشترك (مدرس أو منظمة) لديه مقاعد متاحة؟
 *
 * Checks if the subscriber (teacher or academy) has available seats.
 * Implements the Specification Pattern for composable business rules.
 */
final class SeatAvailable extends AbstractSpecification
{
    /**
     * Check if the candidate satisfies the specification.
     *
     * @param mixed $candidate Either a SubscriptionCandidate, object/array with subscriberId and subscriberType,
     *                         or an int representing subscriberId (defaults to 'teacher' type)
     * @param int $depth Internal parameter for tracking composition depth (ignored in leaf specifications)
     * @return bool
     */
    public function isSatisfiedBy(mixed $candidate, int $depth = 0): bool
    {
        // Convert to SubscriptionCandidate DTO for type-safe access
        $subscriptionCandidate = SubscriptionCandidate::from($candidate);

        if ($subscriptionCandidate->subscriberType === 'teacher') {
            $sub = TeacherSubscription::query()
                ->where('teacher_id', $subscriptionCandidate->subscriberId)
                ->where('status', 'active')
                ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                ->first();

            if (! $sub) {
                return false;
            }

            return $sub->max_students === null || $sub->used_seats < $sub->max_students;
        }

        if ($subscriptionCandidate->subscriberType === 'academy') {
            $sub = AcademySubscription::query()
                ->where('academy_id', $subscriptionCandidate->subscriberId)
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
