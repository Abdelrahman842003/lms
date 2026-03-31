<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class TeacherStudentInactivityRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $total = $context['total_students'] ?? 0;
        $active = $context['active_students'] ?? 0;

        if ($total === 0) {
            return null;
        }

        $inactiveRatio = (($total - $active) / $total) * 100;

        if ($inactiveRatio >= 50) {
            return new AlertResult(
                alertKey: 'teacher_student_inactivity',
                severity: AlertSeverity::Critical,
                message: sprintf('%.0f%% من الطلاب غير نشطين', $inactiveRatio),
                context: ['inactive_ratio' => $inactiveRatio, 'total' => $total, 'active' => $active],
                sourceSection: 'student_activity',
            );
        }

        if ($inactiveRatio >= 30) {
            return new AlertResult(
                alertKey: 'teacher_student_inactivity',
                severity: AlertSeverity::Warning,
                message: sprintf('%.0f%% من الطلاب غير نشطين', $inactiveRatio),
                context: ['inactive_ratio' => $inactiveRatio, 'total' => $total, 'active' => $active],
                sourceSection: 'student_activity',
            );
        }

        return null;
    }
}
