<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class RenewalApproachingRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $daysUntilRenewal = $context['days_until_renewal'] ?? PHP_INT_MAX;
        if ($daysUntilRenewal <= 7) {
            return new AlertResult(
                alertKey: 'renewal_approaching',
                severity: AlertSeverity::Warning,
                message: "Subscription renews in {$daysUntilRenewal} days",
                context: $context,
                sourceSection: 'subscriptions',
            );
        }

        return null;
    }
}
