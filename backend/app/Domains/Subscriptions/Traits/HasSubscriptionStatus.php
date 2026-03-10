<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Traits;

use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Subscriptions\Enums\SubscriptionStatus;

trait HasSubscriptionStatus
{
    /**
     * Check if the subscriber has an active subscription
     *
     * @return bool
     */
    public function hasActiveSubscription(): bool
    {
        $latest = $this->latestSubscription();
        if ($latest) {
            $status = $latest->status instanceof SubscriptionStatus 
                ? $latest->status->value 
                : (string) $latest->status;
            
            // Return false if subscription is in an inactive state
            if (in_array($status, [
                SubscriptionStatus::CANCELLED->value,
                SubscriptionStatus::PENDING->value,
                SubscriptionStatus::PARTIAL->value,
                SubscriptionStatus::EXPIRED->value,
            ], true)) {
                return false;
            }
        }

        // Check if plan has not expired
        $expiresAt = $this->plan_expires_at ? $this->plan_expires_at->copy()->startOfDay() : null;
        return $expiresAt !== null && $expiresAt->gte(now()->startOfDay());
    }

    /**
     * Check if the subscription is blocked (inactive)
     *
     * @return bool
     */
    public function isSubscriptionBlocked(): bool
    {
        return !$this->hasActiveSubscription();
    }

    /**
     * Get the latest subscription
     *
     * @return Subscription|null
     */
    abstract public function latestSubscription(): ?Subscription;
}
