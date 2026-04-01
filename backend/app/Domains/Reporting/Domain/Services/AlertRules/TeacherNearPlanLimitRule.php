<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class TeacherNearPlanLimitRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $usagePct = $context['plan_usage_pct'] ?? 0;

        if ($usagePct >= 95) {
            return new AlertResult(
                alertKey: 'teacher_near_plan_limit',
                severity: AlertSeverity::Critical,
                message: "استخدام الباقة وصل {$usagePct}% - قريب من الحد الأقصى",
                context: ['usage_pct' => $usagePct],
                sourceSection: 'subscription',
                drilldownKey: 'plan_usage_drilldown',
            );
        }

        if ($usagePct >= 80) {
            return new AlertResult(
                alertKey: 'teacher_near_plan_limit',
                severity: AlertSeverity::Warning,
                message: "استخدام الباقة وصل {$usagePct}%",
                context: ['usage_pct' => $usagePct],
                sourceSection: 'subscription',
                drilldownKey: 'plan_usage_drilldown',
            );
        }

        return null;
    }
}
