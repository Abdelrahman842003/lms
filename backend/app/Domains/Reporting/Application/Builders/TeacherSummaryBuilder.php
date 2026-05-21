<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\DTO\KpiCardResult;
use App\Domains\Reporting\Domain\Services\KpiCardFactory;
use App\Domains\Reporting\Domain\ValueObjects\TeacherReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\TeacherScope;
use App\Domains\Reporting\Infrastructure\Queries\TeacherAttendanceQueryService;
use App\Domains\Reporting\Infrastructure\Queries\TeacherGroupQueryService;
use App\Domains\Reporting\Infrastructure\Queries\TeacherIncomeQueryService;
use App\Domains\Reporting\Infrastructure\Queries\TeacherStudentQueryService;
use App\Domains\Reporting\Infrastructure\Queries\TeacherSubscriptionQueryService;

final readonly class TeacherSummaryBuilder
{
    public function __construct(
        private KpiCardFactory $kpiFactory,
        private TeacherStudentQueryService $studentQuery,
        private TeacherIncomeQueryService $incomeQuery,
        private TeacherAttendanceQueryService $attendanceQuery,
        private TeacherGroupQueryService $groupQuery,
        private TeacherSubscriptionQueryService $subscriptionQuery,
    ) {}

    /**
     * @return array<int, KpiCardResult>
     */
    public function build(Teacher $teacher, TeacherScope $scope, TeacherReportFilters $filters): array
    {
        $totalStudents = $this->studentQuery->totalLinkedStudents($teacher, $filters);
        $activeStudents = $this->studentQuery->activeStudentsCount($teacher, $filters);
        $activeGroups = $this->groupQuery->activeGroupsCount($teacher, $filters);
        $attendanceRate = $this->attendanceQuery->overallAttendanceRate($teacher, $filters);
        $currentPeriodIncome = $this->incomeQuery->currentPeriodIncome($teacher, $filters);
        $previousPeriodIncome = $this->incomeQuery->previousPeriodIncome($teacher, $filters);
        $ytdIncome = $this->incomeQuery->yearToDateIncome($teacher, $filters);
        $planUsage = $this->subscriptionQuery->planUsagePercentage($teacher, $filters);

        $metrics = [
            [
                'key' => 'total_students',
                'title' => 'إجمالي الطلاب',
                'current' => $totalStudents,
                'baseline' => null,
                'drilldown_key' => 'total_students_drilldown',
            ],
            [
                'key' => 'active_students',
                'title' => 'الطلاب النشطين',
                'current' => $activeStudents,
                'baseline' => null,
                'drilldown_key' => 'active_students_drilldown',
            ],
            [
                'key' => 'active_groups',
                'title' => 'المجموعات النشطة',
                'current' => $activeGroups,
                'baseline' => null,
                'drilldown_key' => 'active_groups_drilldown',
            ],
            [
                'key' => 'attendance_rate',
                'title' => 'نسبة الحضور',
                'current' => $attendanceRate,
                'baseline' => null,
                'drilldown_key' => 'attendance_rate_drilldown',
            ],
            [
                'key' => 'income_this_period',
                'title' => 'دخل هذه الفترة',
                'current' => $currentPeriodIncome,
                'baseline' => $previousPeriodIncome,
                'drilldown_key' => 'income_this_period_drilldown',
            ],
            [
                'key' => 'income_previous_period',
                'title' => 'دخل الفترة السابقة',
                'current' => $previousPeriodIncome,
                'baseline' => null,
                'drilldown_key' => 'income_previous_period_drilldown',
            ],
            [
                'key' => 'ytd_income',
                'title' => 'دخل السنة',
                'current' => $ytdIncome,
                'baseline' => null,
                'drilldown_key' => 'ytd_income_drilldown',
            ],
            [
                'key' => 'plan_usage',
                'title' => 'استخدام الباقة',
                'current' => $planUsage,
                'baseline' => null,
                'status_color' => $planUsage >= 90 ? 'red' : null,
                'drilldown_key' => 'plan_usage_drilldown',
            ],
        ];

        return array_map(
            fn(array $def) => $this->kpiFactory->make(
                key: $def['key'],
                title: $def['title'],
                currentValue: $def['current'],
                baselineValue: $def['baseline'] ?? null,
                statusColor: $def['status_color'] ?? null,
                drilldownKey: $def['drilldown_key'] ?? null,
            ),
            $metrics,
        );
    }
}
