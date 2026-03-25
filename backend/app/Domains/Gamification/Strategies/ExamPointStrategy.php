<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Auth\Models\Student;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;

/**
 * Strategy for calculating exam points based on score percentage.
 * 
 * @see https://refactoring.guru/design-patterns/strategy
 */
class ExamPointStrategy implements PointCalculationStrategyInterface
{
    /**
     * Calculate points based on exam score percentage.
     */
    public function calculate(Student $student, mixed $context, GamificationSetting $settings): int
    {
        if (!$this->supports($context)) {
            return 0;
        }

        /** @var ExamResult $context */
        return $settings->calculateExamPoints((float) $context->percentage);
    }

    /**
     * Check if this strategy supports the given context.
     */
    public function supports(mixed $context): bool
    {
        return $context instanceof ExamResult;
    }

    /**
     * Get the transaction type.
     */
    public function getTransactionType(): string
    {
        return PointTransaction::TYPE_EXAM_SCORE;
    }

    /**
     * Get the reference type.
     */
    public function getReferenceType(mixed $context): ?string
    {
        return $context instanceof ExamResult ? ExamResult::class : null;
    }

    /**
     * Get the reference ID.
     */
    public function getReferenceId(mixed $context): ?string
    {
        return $context instanceof ExamResult ? $context->id : null;
    }

    /**
     * Generate a description for the transaction.
     */
    public function generateDescription(mixed $context, int $points): string
    {
        if ($context instanceof ExamResult && $context->exam) {
            return "امتحان: {$context->exam->title} - {$context->percentage}%";
        }

        return "Exam points: {$points}";
    }
}
