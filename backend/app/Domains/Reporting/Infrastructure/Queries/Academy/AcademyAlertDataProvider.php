<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Reporting\Domain\Services\AlertEngine;
use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;

final class AcademyAlertDataProvider
{
    public function __construct(
        private readonly AcademyStudentQueries $studentQueries,
        private readonly AcademyAttendanceQueries $attendanceQueries,
        private readonly AcademySessionQueries $sessionQueries,
        private readonly AcademySubscriptionQueries $subscriptionQueries,
        private readonly AcademyTeacherQueries $teacherQueries,
    ) {}

    public function getAlerts(Academy $academy, AcademyReportFilters $filters): array
    {
        $period = $filters->period();
        $alerts = [];

        $activeStudents = $this->studentQueries->getActiveStudents($academy);
        $totalStudents = $this->studentQueries->getTotalStudents($academy);

        if ($totalStudents > 0) {
            $inactiveRatio = ($totalStudents - $activeStudents) / $totalStudents;
            if ($inactiveRatio > 0.4) {
                $alerts[] = [
                    'rule' => 'high_inactivity',
                    'severity' => $inactiveRatio > 0.6 ? 'critical' : 'warning',
                    'message' => sprintf(
                        'نسبة الطلاب غير النشطين مرتفعة (%d%%)',
                        (int) ($inactiveRatio * 100)
                    ),
                    'data' => [
                        'total_students' => $totalStudents,
                        'active_students' => $activeStudents,
                        'inactive_ratio' => round($inactiveRatio * 100, 2),
                    ],
                ];
            }
        }

        $attendanceRate = $this->attendanceQueries->getOverallAttendanceRate($academy, $period);
        if ($attendanceRate > 0 && $attendanceRate < 60) {
            $alerts[] = [
                'rule' => 'attendance_drop',
                'severity' => $attendanceRate < 40 ? 'critical' : 'warning',
                'message' => sprintf('نسبة الحضور منخفضة (%d%%)', (int) $attendanceRate),
                'data' => ['attendance_rate' => $attendanceRate],
            ];
        }

        $canceled = $this->sessionQueries->getCanceledCount($academy, $period);
        $scheduled = $this->sessionQueries->getScheduledCount($academy, $period);
        if ($scheduled > 0 && $canceled > 0) {
            $cancelRate = ($canceled / $scheduled) * 100;
            if ($cancelRate > 20) {
                $alerts[] = [
                    'rule' => 'session_cancellation',
                    'severity' => $cancelRate > 40 ? 'critical' : 'warning',
                    'message' => sprintf('معدل إلغاء الحصص مرتفع (%d%%)', (int) $cancelRate),
                    'data' => [
                        'canceled' => $canceled,
                        'scheduled' => $scheduled,
                        'cancel_rate' => round($cancelRate, 2),
                    ],
                ];
            }
        }

        $usage = $this->subscriptionQueries->getFullSubscriptionUsage($academy);
        if ($usage['student_limit'] > 0 && $usage['usage_percentage'] > 85) {
            $alerts[] = [
                'rule' => 'usage_near_limit',
                'severity' => $usage['usage_percentage'] > 95 ? 'critical' : 'warning',
                'message' => sprintf('الاكاديمية قريبة من حد الاشتراك (%d%%)', (int) $usage['usage_percentage']),
                'data' => $usage,
            ];
        }

        if ($usage['renewal_date']) {
            $renewalDate = \Carbon\Carbon::parse($usage['renewal_date']);
            $daysUntilRenewal = now()->diffInDays($renewalDate, false);
            if ($daysUntilRenewal > 0 && $daysUntilRenewal <= 7) {
                $alerts[] = [
                    'rule' => 'renewal_approaching',
                    'severity' => $daysUntilRenewal <= 3 ? 'critical' : 'info',
                    'message' => sprintf('موعد تجديد الاشتراك بعد %d أيام', $daysUntilRenewal),
                    'data' => [
                        'renewal_date' => $usage['renewal_date'],
                        'days_remaining' => $daysUntilRenewal,
                    ],
                ];
            }
        }

        usort($alerts, fn ($a, $b) => match (true) {
            $a['severity'] === 'critical' && $b['severity'] !== 'critical' => -1,
            $b['severity'] === 'critical' && $a['severity'] !== 'critical' => 1,
            $a['severity'] === 'warning' && $b['severity'] === 'info' => -1,
            $b['severity'] === 'warning' && $a['severity'] === 'info' => 1,
            default => 0,
        });

        return $alerts;
    }
}
