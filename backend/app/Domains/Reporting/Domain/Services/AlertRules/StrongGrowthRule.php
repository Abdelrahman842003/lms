<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class StrongGrowthRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $growthPct = $context['growth_pct'] ?? 0;
        if ($growthPct >= 25) {
            return new AlertResult(
                alertKey: 'strong_growth',
                severity: AlertSeverity::Info,
                message: "Strong growth detected: +{$growthPct}%",
                context: $context,
                sourceSection: 'growth',
            );
        }

        return null;
    }
}
