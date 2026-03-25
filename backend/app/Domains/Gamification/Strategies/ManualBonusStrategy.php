<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Auth\Models\Student;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;
use InvalidArgumentException;

/**
 * Strategy for manual bonus points awarded by teachers.
 * 
 * This strategy is immutable - points and description must be provided
 * at construction time and cannot be changed afterward.
 * 
 * @see https://refactoring.guru/design-patterns/strategy
 */
class ManualBonusStrategy implements PointCalculationStrategyInterface
{
    public function __construct(
        private readonly int $points = 0,
        private readonly string $description = ''
    ) {
        if ($points < 0) {
            throw new InvalidArgumentException('Bonus points cannot be negative');
        }
    }

    /**
     * Calculate points - returns the manually set points.
     */
    public function calculate(Student $student, mixed $context, GamificationSetting $settings): int
    {
        return $this->points;
    }

    /**
     * Check if this strategy supports the given context.
     * Manual bonus supports any context (null or specific).
     */
    public function supports(mixed $context): bool
    {
        return true;
    }

    /**
     * Get the transaction type.
     */
    public function getTransactionType(): string
    {
        return PointTransaction::TYPE_MANUAL_BONUS;
    }

    /**
     * Get the reference type - always null for manual bonuses.
     */
    public function getReferenceType(mixed $context): ?string
    {
        return null;
    }

    /**
     * Get the reference ID - always null for manual bonuses.
     */
    public function getReferenceId(mixed $context): ?string
    {
        return null;
    }

    /**
     * Generate a description for the transaction.
     */
    public function generateDescription(mixed $context, int $points): string
    {
        return $this->description ?: "مكافأة يدوية: {$points} نقطة";
    }
}
