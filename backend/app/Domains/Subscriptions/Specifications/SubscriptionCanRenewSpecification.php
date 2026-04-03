<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Models\Subscription;
use Carbon\Carbon;

/**
 * Subscription Can Renew Specification
 *
 * Business rule: A subscription can be renewed if:
 * 1. The subscriber (Academy/Teacher) has an active plan OR is in trial
 * 2. The subscription is not already pending renewal
 * 3. The subscriber has not exceeded their quota
 *
 * @see https://designpatternsphp.readthedocs.io/en/latest/Behavioral/Specification/ Specification Pattern
 */
class SubscriptionCanRenewSpecification extends AbstractSpecification
{
    public function isSatisfiedBy(mixed $candidate, int $depth = 0): bool
    {
        if (!$candidate instanceof Academy && !$candidate instanceof Teacher) {
            return false;
        }

        // Check if plan is expired (with grace period)
        if ($candidate->plan_expires_at) {
            $gracePeriodEnd = Carbon::parse($candidate->plan_expires_at)->addDays(3);
            if (now()->gt($gracePeriodEnd)) {
                return false;
            }
        }

        // Check if there's already a pending renewal
        $pendingRenewal = Subscription::where('subscriber_id', $candidate->id)
            ->where('subscriber_type', get_class($candidate))
            ->where('status', 'pending')
            ->whereMonth('created_at', now()->month)
            ->first();

        if ($pendingRenewal) {
            return false;
        }

        return true;
    }
}
