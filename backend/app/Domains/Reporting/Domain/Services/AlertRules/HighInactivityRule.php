<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class HighInactivityRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $inactivePct = $context['inactive_percentage'] ?? 0;
        if ($inactivePct >= 50) {
            return new AlertResult(
                alertKey: 'high_inactivity',
                severity: AlertSeverity::Warning,
                message: "{$inactivePct}% of students are inactive",
                context: $context,
                sourceSection: 'students',
            );
        }

        return null;
    }
}
