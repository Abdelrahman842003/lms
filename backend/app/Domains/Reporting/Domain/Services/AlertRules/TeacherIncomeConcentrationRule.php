<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class TeacherIncomeConcentrationRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $incomeByGroup = $context['income_by_group'] ?? [];

        if (empty($incomeByGroup)) {
            return null;
        }

        $totalIncome = array_sum(array_column($incomeByGroup, 'income_contribution'));

        if ($totalIncome <= 0) {
            return null;
        }

        foreach ($incomeByGroup as $group) {
            $contribution = $group['income_contribution'] ?? 0;
            $pct = ($contribution / $totalIncome) * 100;

            if ($pct > 70) {
                return new AlertResult(
                    alertKey: 'teacher_income_concentration',
                    severity: AlertSeverity::Warning,
                    message: "تركز الدخل: مجموعة \"{$group['group_name']}\" تمثل أكثر من 70% من الدخل",
                    context: [
                        'group_name' => $group['group_name'],
                        'concentration_pct' => round($pct, 2),
                    ],
                    sourceSection: 'group_breakdown',
                );
            }
        }

        return null;
    }
}
