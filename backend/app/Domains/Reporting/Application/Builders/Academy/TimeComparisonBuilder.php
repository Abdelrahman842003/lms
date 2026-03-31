<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Reporting\Domain\Services\TrendCalculationService;
use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\ReportingPeriod;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademyStudentQueries;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademyAttendanceQueries;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademySessionQueries;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademySubscriptionQueries;

final readonly class TimeComparisonBuilder
{
    public function __construct(
        private TrendCalculationService $trendService,
        private AcademyStudentQueries $studentQueries,
        private AcademyAttendanceQueries $attendanceQueries,
        private AcademySessionQueries $sessionQueries,
        private AcademySubscriptionQueries $subscriptionQueries,
    ) {}

    public function build(Academy $academy, AcademyReportFilters $filters): array
    {
        if (! $filters->hasComparison()) {
            return [
                'current_period' => [],
                'comparison_period' => [],
                'comparison_mode' => 'none',
                'changes' => [],
            ];
        }

        $currentPeriod = $filters->period();
        $comparison = $filters->comparisonPeriod();

        $previousPeriod = ReportingPeriod::fromCustomRange(
            $comparison->startAt,
            $comparison->endAt,
            $currentPeriod->timezone,
        );

        $currentMetrics = $this->gatherMetrics($academy, $currentPeriod);
        $previousMetrics = $this->gatherMetrics($academy, $previousPeriod);

        $labels = [
            'total_students' => 'إجمالي الطلاب',
            'active_students' => 'الطلاب النشطين',
            'attendance_rate' => 'نسبة الحضور',
            'sessions_delivered' => 'الحصص المقدمة',
            'usage_ratio' => 'نسبة الاستخدام',
        ];

        $changes = [];
        foreach ($currentMetrics as $key => $current) {
            $previous = $previousMetrics[$key] ?? 0;
            $trend = $this->trendService->calculate($current, $previous);

            $changes[] = [
                'metric' => $key,
                'label' => $labels[$key] ?? $key,
                'current' => $current,
                'previous' => $previous,
                'change_pct' => $trend['change_pct'],
                'direction' => $trend['direction']->value,
            ];
        }

        return [
            'current_period' => $currentMetrics,
            'comparison_period' => $previousMetrics,
            'comparison_mode' => $filters->comparisonMode()?->value ?? 'previous_period',
            'changes' => $changes,
        ];
    }

    private function gatherMetrics(Academy $academy, ReportingPeriod $period): array
    {
        return [
            'total_students' => $this->studentQueries->getTotalStudents($academy),
            'active_students' => $this->studentQueries->getActiveStudents($academy),
            'attendance_rate' => $this->attendanceQueries->getOverallAttendanceRate($academy, $period),
            'sessions_delivered' => $this->sessionQueries->getDeliveredCount($academy, $period),
            'usage_ratio' => $this->subscriptionQueries->getUsagePercentage($academy),
        ];
    }
}
