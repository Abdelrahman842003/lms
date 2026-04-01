<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services\AlertRules;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final class TeacherRenewalApproachingRule implements AlertRule
{
    public function evaluate(array $context): ?AlertResult
    {
        $daysUntilRenewal = $context['days_until_renewal'] ?? null;

        if ($daysUntilRenewal === null) {
            return null;
        }

        if ($daysUntilRenewal <= 3) {
            return new AlertResult(
                alertKey: 'teacher_renewal_approaching',
                severity: AlertSeverity::Critical,
                message: "الاشتراك ينتهي خلال {$daysUntilRenewal} أيام",
                context: ['days_until_renewal' => $daysUntilRenewal],
                sourceSection: 'subscription',
            );
        }

        if ($daysUntilRenewal <= 7) {
            return new AlertResult(
                alertKey: 'teacher_renewal_approaching',
                severity: AlertSeverity::Warning,
                message: "الاشتراك ينتهي خلال {$daysUntilRenewal} أيام",
                context: ['days_until_renewal' => $daysUntilRenewal],
                sourceSection: 'subscription',
            );
        }

        if ($daysUntilRenewal <= 14) {
            return new AlertResult(
                alertKey: 'teacher_renewal_approaching',
                severity: AlertSeverity::Info,
                message: "الاشتراك ينتهي خلال {$daysUntilRenewal} يوم",
                context: ['days_until_renewal' => $daysUntilRenewal],
                sourceSection: 'subscription',
            );
        }

        return null;
    }
}
