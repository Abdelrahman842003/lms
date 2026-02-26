<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Gamification\Models\GamificationSetting;

/**
 * يحسب XP لمراجعة الأخطاء (Mistake Review).
 *
 * context keys:
 *  - mastered_count: int  (عدد الأسئلة التي أتقنها الطالب)
 */
final class MistakeReviewXpCalculator implements XpCalculationStrategy
{
    private const XP_PER_MASTERED = 5;

    public function calculate(GamificationSetting $settings, array $context): int
    {
        $masteredCount = (int) ($context['mastered_count'] ?? 0);

        return max(0, $masteredCount * self::XP_PER_MASTERED);
    }
}
