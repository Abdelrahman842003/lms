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

        if ($exam && in_array($exam->type, ['self_test', 'dynamic'])) {
            $attempt = $context->attempt;
            if (!$attempt) {
                return 0; // Fallback
            }
            
            $points = 0;
            $answers = $attempt->answers()->where('is_correct', true)->get();
            
            foreach ($answers as $answer) {
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
