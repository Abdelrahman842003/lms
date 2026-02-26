<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Gamification\Models\GamificationSetting;

/**
 * يحسب XP للامتحانات بناءً على النسبة المئوية.
 *
 * context keys:
 *  - percentage    : float  (0-100)
 *  - is_first_place: bool   (هل الطالب الأول؟)
 *  - is_retake     : bool   (هل هي إعادة؟)
 */
final class ExamXpCalculator implements XpCalculationStrategy
{
    public function calculate(GamificationSetting $settings, array $context): int
    {
        $percentage   = (float) ($context['percentage'] ?? 0);
        $isFirstPlace = (bool) ($context['is_first_place'] ?? false);
        $isRetake     = (bool) ($context['is_retake'] ?? false);
        $maxPoints    = $settings->exam_max_points ?? 50;

        // نسبة من max_points بناءً على الدرجة
        $xp = (int) round(($percentage / 100) * $maxPoints);

        if ($isFirstPlace) {
            $xp += $settings->exam_first_place_bonus ?? 25;
        }

        if ($isRetake) {
            $xp += $settings->exam_retake_bonus ?? 20;
        }

        return max(0, $xp);
    }
}
