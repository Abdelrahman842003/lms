<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Gamification\Models\GamificationSetting;

/**
 * Strategy Interface لحساب XP.
 * كل نوع نشاط (حضور / امتحان / مراجعة) له Calculator خاص.
 */
interface XpCalculationStrategy
{
    /**
     * يحسب نقاط XP بناءً على السياق الممرر.
     *
     * @param  array<string, mixed>  $context
     */
    public function calculate(GamificationSetting $settings, array $context): int;
}
