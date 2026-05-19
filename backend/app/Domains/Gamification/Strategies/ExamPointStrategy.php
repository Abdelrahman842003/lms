<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Auth\Models\Student;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;

/**
 * Strategy for calculating exam points based on score percentage or difficulty.
 * 
 * @see https://refactoring.guru/design-patterns/strategy
 */
class ExamPointStrategy implements PointCalculationStrategyInterface
{
    /**
     * Calculate points based on exam score percentage or difficulty for dynamic exams.
     */
    public function calculate(Student $student, mixed $context, GamificationSetting $settings): int
    {
        if (!$this->supports($context)) {
            return 0;
        }

        /** @var ExamResult $context */
        $exam = $context->exam;
        $percentage = (float) $context->percentage;

        // 1. Check if student failed
        $passingPercentage = $settings->exam_passing_percentage ?? 50;
        if ($percentage < $passingPercentage) {
            $deduction = $settings->exam_fail_deduction ?? 10;
            return -abs((int) $deduction); // Ensure it's negative
        }

        // 2. If passed, calculate points based on question difficulty (for all exams if attempt exists)
        $attempt = $context->attempt;
        if ($attempt) {
            $points = 0;
            $correctAnswers = $attempt->answers()->where('is_correct', true)->get();
            
            if ($correctAnswers->isNotEmpty()) {
                foreach ($correctAnswers as $answer) {
                    $snapshot = $answer->question_snapshot;
                    // If snapshot is missing difficulty, fallback to relation or medium
                    $difficulty = $snapshot['difficulty'] ?? ($answer->question->difficulty ?? 'medium');
                    
                    $points += match ($difficulty) {
                        'easy' => $settings->question_easy_points,
                        'hard' => $settings->question_hard_points,
                        default => $settings->question_medium_points,
                    };
                }
                return $points;
            }
        }

        // 3. Fallback: Calculation based on percentage if no attempt or answers found
        return $settings->calculateExamPoints($percentage);
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
            $examTypeLabel = match($context->exam->type) {
                'self_test' => 'اختبر نفسك',
                'dynamic' => 'امتحان ديناميكي',
                default => 'امتحان',
            };
            return "{$examTypeLabel}: {$context->exam->title} - {$context->percentage}%";
        }

        return "Exam points: {$points}";
    }
}
