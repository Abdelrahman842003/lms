<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Subscriptions\DTOs\SubscriptionCandidate;

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

        $subscriber = $subscriptionCandidate->subscriberType === 'teacher'
            ? \App\Domains\Auth\Models\Teacher::find($subscriptionCandidate->subscriberId)
            : \App\Domains\Auth\Models\Academy::find($subscriptionCandidate->subscriberId);

        if (!$subscriber) {
            return false;
        }

        return $subscriber->hasActiveSubscription();
    }
}
