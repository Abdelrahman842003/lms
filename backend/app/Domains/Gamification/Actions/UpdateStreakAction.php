<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Actions;

use App\Domains\Gamification\Events\BadgeEarned;
use App\Domains\Gamification\Models\StudentPoint;

/**
 * يُحدّث attendance_streak للطالب ويتحقق من Badges.
 *
 * قواعد:
 *  - حضر → streak++
 *  - غاب → streak = 0
 *  - streak == 5  → BadgeEarned (streak_5)
 *  - streak == 10 → BadgeEarned (streak_10)
 */
final class UpdateStreakAction
{
    public function execute(int $studentId, string $teacherId, bool $attended): void
    {
        $studentPoint = StudentPoint::getOrCreate((string) $studentId, $teacherId);

        if ($attended) {
            $newStreak = $studentPoint->attendance_streak + 1;
            $studentPoint->update(['attendance_streak' => $newStreak]);

            // إطلاق badge إذا وصل لمعلم
            if ($newStreak === 5) {
                BadgeEarned::dispatch($studentId, $teacherId, 'streak_5', 'حضور 5 أيام متتالية!');
            } elseif ($newStreak === 10) {
                BadgeEarned::dispatch($studentId, $teacherId, 'streak_10', 'حضور 10 أيام متتالية!');
            }
        } else {
            $studentPoint->update(['attendance_streak' => 0]);
        }
    }
}
