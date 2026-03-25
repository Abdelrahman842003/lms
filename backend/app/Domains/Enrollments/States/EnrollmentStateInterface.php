<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\States;

use App\Domains\Enrollments\Models\Enrollment;

/**
 * State interface for enrollment status transitions.
 * 
 * Implementations define behavior and allowed transitions for each enrollment state.
 * 
 * @see https://refactoring.guru/design-patterns/state
 */
interface EnrollmentStateInterface
{
    /**
     * Get the state name/identifier.
     */
    public function getName(): string;

    /**
     * Check if the enrollment can be activated in this state.
     */
    public function canActivate(Enrollment $enrollment): bool;

    /**
     * Check if the enrollment can be deactivated in this state.
     */
    public function canDeactivate(Enrollment $enrollment): bool;

    /**
     * Check if the enrollment can be renewed in this state.
     */
    public function canRenew(Enrollment $enrollment): bool;

    /**
     * Check if the enrollment can access content in this state.
     */
    public function canAccessContent(Enrollment $enrollment): bool;

    /**
     * Check if the enrollment is in a trial period.
     */
    public function isTrial(): bool;

    /**
     * Check if the enrollment is active.
     */
    public function isActive(): bool;

    /**
     * Check if the enrollment is expired.
     */
    public function isExpired(): bool;

    /**
     * Get the color for UI display.
     */
    public function getColor(): string;

    /**
     * Get the label for UI display.
     */
    public function getLabel(): string;

    /**
     * Get the next state based on current conditions.
     */
    public function getNextState(Enrollment $enrollment): ?EnrollmentStateInterface;

    /**
     * Get allowed transitions from this state.
     *
     * @return array<string>
     */
    public function getAllowedTransitions(): array;
}
