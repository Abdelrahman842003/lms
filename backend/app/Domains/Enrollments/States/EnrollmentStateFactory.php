<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\States;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Services\EnrollmentStatusService;
use InvalidArgumentException;

/**
 * Factory for creating enrollment state instances.
 * 
 * Determines the appropriate state based on enrollment data.
 * 
 * @see https://refactoring.guru/design-patterns/state
 */
class EnrollmentStateFactory
{
    private static array $states = [
        'trial' => TrialState::class,
        'active' => ActiveState::class,
        'inactive' => InactiveState::class,
        'grace_period' => GracePeriodState::class,
        'expired' => ExpiredState::class,
    ];

    public function __construct(
        private readonly EnrollmentStatusService $statusService
    ) {}

    /**
     * Create a state instance from a state name.
     */
    public static function createFromName(string $stateName): EnrollmentStateInterface
    {
        if (!isset(self::$states[$stateName])) {
            throw new InvalidArgumentException("Unknown enrollment state: {$stateName}");
        }

        $class = self::$states[$stateName];
        return new $class();
    }

    /**
     * Create a state instance based on enrollment data.
     */
    public function createFromEnrollment(Enrollment $enrollment): EnrollmentStateInterface
    {
        $statusName = $this->statusService->getStatus($enrollment);
        return self::createFromName($statusName);
    }

    /**
     * Get all available state names.
     *
     * @return array<string>
     */
    public static function getAvailableStates(): array
    {
        return array_keys(self::$states);
    }

    /**
     * Get all state instances.
     *
     * @return array<EnrollmentStateInterface>
     */
    public static function getAllStates(): array
    {
        return array_map(
            fn(string $class) => new $class(),
            self::$states
        );
    }

    /**
     * Check if a state name is valid.
     */
    public static function isValidState(string $stateName): bool
    {
        return isset(self::$states[$stateName]);
    }

    /**
     * Register a custom state.
     */
    public static function registerState(string $name, string $class): void
    {
        if (!is_subclass_of($class, EnrollmentStateInterface::class)) {
            throw new InvalidArgumentException(
                "Class {$class} must implement EnrollmentStateInterface"
            );
        }

        self::$states[$name] = $class;
    }
}
