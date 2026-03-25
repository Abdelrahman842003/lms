<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Subscriptions\DTOs\SubscriptionCandidate;
use App\Domains\Subscriptions\Models\TeacherSubscription;
use App\Domains\Subscriptions\Models\AcademySubscription;

/**
 * Specification: هل الباقة المرتبطة بالمشترك نشطة وغير منتهية؟
 *
 * Checks if the subscription plan associated with a subscriber is active and not expired.
 * Implements the Specification Pattern for composable business rules.
 */
final class PlanActive extends AbstractSpecification
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
            return TeacherSubscription::query()
                ->where('teacher_id', $subscriptionCandidate->subscriberId)
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
                })
                ->exists();
        }

        if ($subscriptionCandidate->subscriberType === 'academy') {
            return AcademySubscription::query()
                ->where('academy_id', $subscriptionCandidate->subscriberId)
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
                })
                ->exists();
        }

        return false;
    }
}
