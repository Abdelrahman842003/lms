<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\States;

use App\Domains\Enrollments\Models\Enrollment;

/**
 * Base class for enrollment states with common functionality.
 * 
 * @see https://refactoring.guru/design-patterns/state
 */
abstract class AbstractEnrollmentState implements EnrollmentStateInterface
{
    /**
     * Default: cannot activate unless already inactive.
     */
    public function canActivate(Enrollment $enrollment): bool
    {
        return false;
    }

    /**
     * Default: can deactivate if active.
     */
    public function canDeactivate(Enrollment $enrollment): bool
    {
        return $this->isActive();
    }

    /**
     * Default: can renew if not already active with valid subscription.
     */
    public function canRenew(Enrollment $enrollment): bool
    {
        return true;
    }

    /**
     * Default: only active enrollments can access content.
     */
    public function canAccessContent(Enrollment $enrollment): bool
    {
        return $this->isActive() || $this->isTrial();
    }

    /**
     * Default: not a trial.
     */
    public function isTrial(): bool
    {
        return false;
    }

    /**
     * Default: not active.
     */
    public function isActive(): bool
    {
        return false;
    }

    /**
     * Default: not expired.
     */
    public function isExpired(): bool
    {
        return false;
    }

    /**
     * Default: gray color.
     */
    public function getColor(): string
    {
        return 'gray';
    }

    /**
     * Default: no transitions.
     */
    public function getAllowedTransitions(): array
    {
        return [];
    }

    /**
     * Default: no next state.
     */
    public function getNextState(Enrollment $enrollment): ?EnrollmentStateInterface
    {
        return null;
    }
}
