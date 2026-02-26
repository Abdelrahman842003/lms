<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Gamification\Models\GamificationSetting;

/**
 * يحسب XP للحضور بناءً على إعدادات المدرس + streak الطالب.
 *
 * context keys:
 *  - streak  : int  (عدد الأيام المتتالية)
 */
final class AttendanceXpCalculator implements XpCalculationStrategy
{
    public function calculate(GamificationSetting $settings, array $context): int
    {
        $base   = $settings->attendance_points ?? 10;
        $streak = (int) ($context['streak'] ?? 0);

        // Streak bonuses
        if ($streak >= 10) {
            $base += $settings->streak_10_bonus ?? 30;
        } elseif ($streak >= 5) {
            $base += $settings->streak_5_bonus ?? 15;
        }

        return max(0, $base);
    }
}
