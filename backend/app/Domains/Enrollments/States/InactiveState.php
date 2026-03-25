<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\States;

use App\Domains\Enrollments\Models\Enrollment;

/**
 * Inactive state - enrollment has been manually deactivated.
 * 
 * @see https://refactoring.guru/design-patterns/state
 */
class InactiveState extends AbstractEnrollmentState
{
    public function getName(): string
    {
        return 'inactive';
    }

    public function getLabel(): string
    {
        return 'غير نشط';
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
        return true;
    }

    public function canDeactivate(Enrollment $enrollment): bool
    {
        return false; // Already inactive
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
        return ['active', 'trial'];
    }

    public function getNextState(Enrollment $enrollment): ?EnrollmentStateInterface
    {
        // If reactivated
        if ($enrollment->is_active) {
            if ($enrollment->subscription_end) {
                return new ActiveState();
            }
            return new TrialState();
        }

        return null; // Still inactive
    }
}
