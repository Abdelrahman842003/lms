<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Auth\Models\Student;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Lectures\Models\Lecture;

/**
 * Strategy for calculating attendance points.
 * 
 * @see https://refactoring.guru/design-patterns/strategy
 */
class AttendancePointStrategy implements PointCalculationStrategyInterface
{
    /**
     * Calculate points for lecture attendance.
     */
    public function calculate(Student $student, mixed $context, GamificationSetting $settings): int
    {
        if (!$this->supports($context)) {
            return 0;
        }

        return $settings->attendance_points;
    }

    /**
     * Check if this strategy supports the given context.
     */
    public function supports(mixed $context): bool
    {
        return $context instanceof Lecture;
    }

    /**
     * Get the transaction type.
     */
    public function getTransactionType(): string
    {
        return PointTransaction::TYPE_ATTENDANCE;
    }

    /**
     * Get the reference type.
     */
    public function getReferenceType(mixed $context): ?string
    {
        return $context instanceof Lecture ? Lecture::class : null;
    }

    /**
     * Get the reference ID.
     */
    public function getReferenceId(mixed $context): ?string
    {
        return $context instanceof Lecture ? $context->id : null;
    }

    /**
     * Generate a description for the transaction.
     */
    public function generateDescription(mixed $context, int $points): string
    {
        if ($context instanceof Lecture) {
            return "حضور حصة: {$context->title}";
        }

        return 'Attendance points';
    }
}
