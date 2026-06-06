<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Actions;

use App\Domains\Gamification\Events\BadgeEarned;
use App\Domains\Gamification\Events\XpGranted;
use App\Domains\Gamification\Strategies\XpCalculationStrategy;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Gamification\Models\StudentPoint;
use Illuminate\Support\Facades\DB;

/**
 * يمنح XP للطالب باستخدام Strategy مناسبة.
 *
 * Usage:
 *   app(GrantXpAction::class)->execute(
 *       studentId: 42,
 *       teacherId: 'uuid',
 *       strategy: new ExamXpCalculator(),
 *       context: ['percentage' => 85.0, 'is_first_place' => false],
 *       referenceId: $examId,
 *   );
 */
final class GrantXpAction
{
    public function execute(
        string $studentId,
        string $teacherId,
        XpCalculationStrategy $strategy,
        array $context = [],
        ?string $referenceId = null,
        string $type = 'manual',
    ): int {
        // جلب إعدادات Gamification للمدرس
        $settings = GamificationSetting::firstOrCreate(
            ['teacher_profile_id' => $teacherId],
            GamificationSetting::DEFAULTS,
        );

        if (! $settings->is_enabled) {
            return 0;
        }

        $xp = $strategy->calculate($settings, $context);

        if ($xp <= 0) {
            return 0;
        }

        DB::transaction(function () use ($studentId, $teacherId, $xp, $type, $referenceId) {
            // 1. تحديث StudentPoint
            $studentPoint = StudentPoint::getOrCreate((string) $studentId, $teacherId);
            $studentPoint->increment('total_points', $xp);

            // 2. تسجيل Transaction
            PointTransaction::create([
                'student_id'     => $studentId,
                'teacher_profile_id' => $teacherId,
                'type'           => $type,
                'points'         => $xp,
                'reference_type' => $type,
                'reference_id'   => $referenceId,
                'description'    => "XP مكتسبة: {$xp} نقطة من نشاط {$type}",
            ]);
        });

        // 3. إطلاق حدث XpGranted
        XpGranted::dispatch($studentId, $teacherId, $xp, $type, $referenceId);

        return $xp;
    }
}
