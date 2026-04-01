<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class AttendanceDropRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $drop = $context['attendance_drop_pct'] ?? 0;
        if ($drop >= 20) {
            return new AlertResult(
                alertKey: 'attendance_drop',
                severity: AlertSeverity::Critical,
                message: "Attendance dropped by {$drop}%",
                context: $context,
                sourceSection: 'attendance',
            );
        }
        if ($drop >= 10) {
            return new AlertResult(
                alertKey: 'attendance_drop',
                severity: AlertSeverity::Warning,
                message: "Attendance dropped by {$drop}%",
                context: $context,
                sourceSection: 'attendance',
            );
        }

        return null;
    }
}
