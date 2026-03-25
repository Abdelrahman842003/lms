<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\States;

use App\Domains\Enrollments\Models\Enrollment;

/**
 * Trial state - enrollment is in trial period.
 * 
 * @see https://refactoring.guru/design-patterns/state
 */
class TrialState extends AbstractEnrollmentState
{
    public function getName(): string
    {
        return 'trial';
    }

    public function getLabel(): string
    {
        return 'فترة تجريبية';
    }

    public function getColor(): string
    {
        return 'info';
    }

    public function isTrial(): bool
    {
        return true;
    }

    public function canActivate(Enrollment $enrollment): bool
    {
        return true;
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
        return ['active', 'inactive', 'expired'];
    }

    public function getNextState(Enrollment $enrollment): ?EnrollmentStateInterface
    {
        // If activated with subscription, becomes active
        if ($enrollment->is_active && $enrollment->subscription_end) {
            return new ActiveState();
        }

        // If manually deactivated
        if (!$enrollment->is_active) {
            return new InactiveState();
        }

        // Trial expired
        return new ExpiredState();
    }
}
