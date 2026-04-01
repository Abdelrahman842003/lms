<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class RevenueDropRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $drop = $context['revenue_drop_pct'] ?? 0;
        if ($drop >= 20) {
            return new AlertResult(
                alertKey: 'revenue_drop',
                severity: AlertSeverity::Critical,
                message: "Revenue dropped by {$drop}%",
                context: $context,
                sourceSection: 'revenue',
            );
        }
        if ($drop >= 10) {
            return new AlertResult(
                alertKey: 'revenue_drop',
                severity: AlertSeverity::Warning,
                message: "Revenue dropped by {$drop}%",
                context: $context,
                sourceSection: 'revenue',
            );
        }

        return null;
    }
}
