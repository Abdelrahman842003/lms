<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Subscriptions\DTOs\SubscriptionCandidate;

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

        $subscriber = $subscriptionCandidate->subscriberType === 'teacher'
            ? \App\Domains\Auth\Models\Teacher::find($subscriptionCandidate->subscriberId)
            : \App\Domains\Auth\Models\Academy::find($subscriptionCandidate->subscriberId);

        if (!$subscriber) {
            return false;
        }

        if ($subscriber->is_unlimited_students) {
            return true;
        }

        $limit = (int) ($subscriber->plan_max_students ?? 0);

        $used = $subscriptionCandidate->subscriberType === 'teacher'
            ? $subscriber->activeEnrollments()->count()
            : \App\Domains\Enrollments\Models\Enrollment::where('academy_id', $subscriber->id)
                ->where('is_active', true)
                ->distinct('student_id')
                ->count('student_id');

        return $used < $limit;
    }
}
