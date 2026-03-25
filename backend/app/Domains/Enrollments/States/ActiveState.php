<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\States;

use App\Domains\Enrollments\Models\Enrollment;

/**
 * Active state - enrollment is active with valid subscription.
 * 
 * @see https://refactoring.guru/design-patterns/state
 */
class ActiveState extends AbstractEnrollmentState
{
    public function getName(): string
    {
        return 'active';
    }

    public function getLabel(): string
    {
        return 'نشط';
    }

    public function getColor(): string
    {
        return 'success';
    }

    public function isActive(): bool
    {
        return true;
    }

    public function canActivate(Enrollment $enrollment): bool
    {
        return false; // Already active
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
        return true;
    }

    public function getAllowedTransitions(): array
    {
        return ['inactive', 'expired', 'grace_period'];
    }

    public function getNextState(Enrollment $enrollment): ?EnrollmentStateInterface
    {
        // If manually deactivated
        if (!$enrollment->is_active) {
            return new InactiveState();
        }

        // If subscription expired, check for grace period
        if ($enrollment->subscription_end && now()->gt($enrollment->subscription_end)) {
            return new GracePeriodState();
        }

        return null; // Still active
    }
}
