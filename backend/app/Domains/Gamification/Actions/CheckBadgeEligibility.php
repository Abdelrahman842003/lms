<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Actions;

use App\Domains\Gamification\Events\BadgeEarned;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\StudentPoint;

/**
 * يتحقق من أهلية الطالب للحصول على badge.
 *
 * الـ Badge types المدعومة:
 *  - perfect_month: حضر كل أيام الشهر
 *  - streak_5, streak_10: تتبعها UpdateStreakAction مباشرة
 */
final class CheckBadgeEligibility
{
    public function checkPerfectMonth(int $studentId, string $teacherId, int $attendedDays, int $totalDays): void
    {
        if ($totalDays <= 0) {
            return;
        }

        if ($attendedDays >= $totalDays) {
            $settings = GamificationSetting::where('teacher_id', $teacherId)->first();

            if ($settings?->is_enabled) {
                BadgeEarned::dispatch(
                    $studentId,
                    $teacherId,
                    'perfect_month',
                    "حضور مثالي! {$attendedDays}/{$totalDays} يوم"
                );
            }
        }
    }

    public function checkStreakMilestone(int $studentId, string $teacherId, int $streak): void
    {
        $milestones = [5 => 'streak_5', 10 => 'streak_10'];

        foreach ($milestones as $threshold => $badge) {
            if ($streak === $threshold) {
                BadgeEarned::dispatch($studentId, $teacherId, $badge, "وصلت لـ {$threshold} أيام متتالية!");
            }
        }
    }
}
