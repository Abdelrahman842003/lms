<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\States;

use App\Domains\Enrollments\Models\Enrollment;

/**
 * Expired state - enrollment has expired past all grace periods.
 * 
 * @see https://refactoring.guru/design-patterns/state
 */
class ExpiredState extends AbstractEnrollmentState
{
    public function getName(): string
    {
        return 'expired';
    }

    public function getLabel(): string
    {
        return 'منتهي';
    }

    public function getColor(): string
    {
        return 'danger';
    }

    public function isExpired(): bool
    {
        return true;
    }

    public function canActivate(Enrollment $enrollment): bool
    {
        return true; // Can reactivate with renewal
    }

    public function canDeactivate(Enrollment $enrollment): bool
    {
        return false; // Already expired
    }

    public function canRenew(Enrollment $enrollment): bool
    {
        return true;
    }

    public function canAccessContent(Enrollment $enrollment): bool
    {
        return false;
    }

    public function getAllowedTransitions(): array
    {
        return ['active', 'inactive'];
    }

    public function getNextState(Enrollment $enrollment): ?EnrollmentStateInterface
    {
        // If renewed
        if ($enrollment->subscription_end && now()->lte($enrollment->subscription_end)) {
            return new ActiveState();
        }

        // If manually set to inactive
        if (!$enrollment->is_active) {
            return new InactiveState();
        }

        return null; // Still expired
    }
}
