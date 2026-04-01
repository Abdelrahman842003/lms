<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class UsageNearLimitRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $usage = $context['usage_percentage'] ?? 0;
        if ($usage >= 90) {
            return new AlertResult(
                alertKey: 'usage_near_limit',
                severity: AlertSeverity::Critical,
                message: "Subscription usage at {$usage}%",
                context: $context,
                sourceSection: 'subscriptions',
            );
        }
        if ($usage >= 75) {
            return new AlertResult(
                alertKey: 'usage_near_limit',
                severity: AlertSeverity::Warning,
                message: "Subscription usage at {$usage}%",
                context: $context,
                sourceSection: 'subscriptions',
            );
        }

        return null;
    }
}
