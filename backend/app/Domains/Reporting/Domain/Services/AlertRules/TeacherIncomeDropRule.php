<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class TeacherIncomeDropRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $changePct = $context['income_change_pct'] ?? null;
        $direction = $context['income_direction'] ?? 'stable';

        if ($direction !== 'down' || $changePct === null) {
            return null;
        }

        $absChange = abs($changePct);

        if ($absChange >= 30) {
            return new AlertResult(
                alertKey: 'teacher_income_drop',
                severity: AlertSeverity::Critical,
                message: "انخفض الدخل بنسبة {$absChange}%",
                context: ['change_pct' => $changePct],
                sourceSection: 'income_trends',
            );
        }

        if ($absChange >= 15) {
            return new AlertResult(
                alertKey: 'teacher_income_drop',
                severity: AlertSeverity::Warning,
                message: "انخفض الدخل بنسبة {$absChange}%",
                context: ['change_pct' => $changePct],
                sourceSection: 'income_trends',
            );
        }

        return null;
    }
}
