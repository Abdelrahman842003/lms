<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\States;

use App\Domains\Enrollments\Models\Enrollment;

/**
 * Grace period state - subscription expired but within grace period.
 * 
 * @see https://refactoring.guru/design-patterns/state
 */
class GracePeriodState extends AbstractEnrollmentState
{
    public function getName(): string
    {
        return 'grace_period';
    }

    public function getLabel(): string
    {
        return 'فترة سماح';
    }

    public function getColor(): string
    {
        return 'warning';
    }

    public function isExpired(): bool
    {
        return false;
    }

    public function canActivate(Enrollment $enrollment): bool
    {
        return true; // Can reactivate with renewal
    }

    public function canDeactivate(Enrollment $enrollment): bool
    {
        return true;
    }

    public function canRenew(Enrollment $enrollment): bool
    {
        return true;
    }

    public function canAccessContent(Enrollment $enrollment): bool
    {
        return true; // Allow access during grace period
    }

    public function getAllowedTransitions(): array
    {
        return ['active', 'inactive', 'expired'];
    }

    public function getNextState(Enrollment $enrollment): ?EnrollmentStateInterface
    {
        // If renewed
        if ($enrollment->subscription_end && now()->lte($enrollment->subscription_end)) {
            return new ActiveState();
        }

        // If manually deactivated
        if (!$enrollment->is_active) {
            return new InactiveState();
        }

        // Grace period expired
        return new ExpiredState();
    }
}
