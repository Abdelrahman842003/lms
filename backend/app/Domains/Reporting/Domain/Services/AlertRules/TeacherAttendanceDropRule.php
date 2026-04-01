<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;
use App\Domains\Reporting\Domain\Contracts\AlertRule;

final class TeacherAttendanceDropRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $rate = $context['attendance_rate'] ?? 0;
        $direction = $context['attendance_direction'] ?? 'stable';

        if ($direction !== 'down' && $rate >= 50) {
            return null;
        }

        if ($rate < 50) {
            return new AlertResult(
                alertKey: 'teacher_attendance_drop',
                severity: AlertSeverity::Critical,
                message: "نسبة الحضور منخفضة جداً: {$rate}%",
                context: ['attendance_rate' => $rate, 'direction' => $direction],
                sourceSection: 'attendance',
            );
        }

        if ($rate < 70) {
            return new AlertResult(
                alertKey: 'teacher_attendance_drop',
                severity: AlertSeverity::Warning,
                message: "نسبة الحضور منخفضة: {$rate}%",
                context: ['attendance_rate' => $rate, 'direction' => $direction],
                sourceSection: 'attendance',
            );
        }

        return null;
    }
}
