<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Auth\Models\Student;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Videos\Models\Video;

/**
 * Strategy for calculating video completion points.
 * 
 * @see https://refactoring.guru/design-patterns/strategy
 */
class VideoPointStrategy implements PointCalculationStrategyInterface
{
    /**
     * Calculate points for video completion.
     */
    public function calculate(Student $student, mixed $context, GamificationSetting $settings): int
    {
        if (!$this->supports($context)) {
            return 0;
        }

        return $settings->video_points ?? 10; // Default to 10 points if not configured
    }

    /**
     * Check if this strategy supports the given context.
     */
    public function supports(mixed $context): bool
    {
        return $context instanceof Video;
    }

    /**
     * Get the transaction type.
     */
    public function getTransactionType(): string
    {
        return PointTransaction::TYPE_VIDEO;
    }

    /**
     * Get the reference type.
     */
    public function getReferenceType(mixed $context): ?string
    {
        return $context instanceof Video ? Video::class : null;
    }

    /**
     * Get the reference ID.
     */
    public function getReferenceId(mixed $context): ?string
    {
        return $context instanceof Video ? $context->id : null;
    }

    /**
     * Generate a description for the transaction.
     */
    public function generateDescription(mixed $context, int $points): string
    {
        if ($context instanceof Video) {
            return "مشاهدة فيديو: {$context->title}";
        }

        return "Video completion points: {$points}";
    }
}
