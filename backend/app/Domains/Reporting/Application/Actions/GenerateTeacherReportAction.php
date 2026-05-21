<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Actions;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Application\Builders\TeacherAttendanceBuilder;
use App\Domains\Reporting\Application\Builders\TeacherGroupBreakdownBuilder;
use App\Domains\Reporting\Application\Builders\TeacherIncomeTrendBuilder;
use App\Domains\Reporting\Application\Builders\TeacherStudentActivityBuilder;
use App\Domains\Reporting\Application\Builders\TeacherSubscriptionBuilder;
use App\Domains\Reporting\Application\Builders\TeacherSummaryBuilder;
use App\Domains\Reporting\Domain\Services\TeacherAlertEngine;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\TeacherReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\TeacherScope;
use App\Domains\Reporting\Infrastructure\Queries\TeacherAttendanceQueryService;
use App\Domains\Reporting\Infrastructure\Queries\TeacherGroupQueryService;
use App\Domains\Reporting\Infrastructure\Queries\TeacherIncomeQueryService;
use App\Domains\Reporting\Infrastructure\Queries\TeacherStudentQueryService;
use App\Domains\Reporting\Infrastructure\Queries\TeacherSubscriptionQueryService;

final readonly class GenerateTeacherReportAction
{
    public function __construct(
        private BuildReportContextAction $buildContext,
        private TeacherSummaryBuilder $summaryBuilder,
        private TeacherIncomeTrendBuilder $incomeTrendBuilder,
        private TeacherStudentActivityBuilder $studentActivityBuilder,
        private TeacherAttendanceBuilder $attendanceBuilder,
        private TeacherGroupBreakdownBuilder $groupBreakdownBuilder,
        private TeacherSubscriptionBuilder $subscriptionBuilder,
        private TeacherAlertEngine $alertEngine,
        private TeacherStudentQueryService $studentQueryService,
        private TeacherIncomeQueryService $incomeQueryService,
        private TeacherAttendanceQueryService $attendanceQueryService,
        private TeacherGroupQueryService $groupQueryService,
        private TeacherSubscriptionQueryService $subscriptionQueryService,
    ) {}

    public function execute(Teacher $teacher, array $input): array
    {
        $baseFilters = $this->buildContext->execute($input);

        $filters = new TeacherReportFilters(
            base: $baseFilters,
            groupId: $input['group_id'] ?? null,
            studentActivityState: $input['student_activity_state'] ?? null,
            attendanceState: $input['attendance_state'] ?? null,
        );

        $scope = TeacherScope::fromRequest(
            teacherId: $teacher->id,
            groupId: $filters->groupId,
        );

        $summary = $this->summaryBuilder->build($teacher, $scope, $filters);

        $sections = [];

        $sections['income_trends'] = $this->incomeTrendBuilder->build($teacher, $scope, $filters);
        $sections['student_activity'] = $this->studentActivityBuilder->build($teacher, $scope, $filters);
        $sections['attendance'] = $this->attendanceBuilder->build($teacher, $scope, $filters);
        $sections['group_breakdown'] = $this->groupBreakdownBuilder->build($teacher, $scope, $filters);
        $sections['subscription'] = $this->subscriptionBuilder->build($teacher, $scope, $filters);

        $alertContext = $this->buildAlertContext($teacher, $scope, $filters, $sections);
        $alerts = $this->alertEngine->evaluate($alertContext);

        return [
            'meta' => [
                'generated_at' => now()->toIso8601String(),
                'timezone' => $filters->base->period->timezone->getName(),
                'report_scope' => 'teacher',
                'version' => '2.0',
            ],
            'applied_filters' => $filters->toArray(),
            'summary' => array_map(fn($kpi) => $kpi->toArray(), $summary),
            'sections' => $sections,
            'alerts' => array_map(fn($alert) => $alert->toArray(), $alerts),
        ];
    }

    private function buildAlertContext(Teacher $teacher, TeacherScope $scope, TeacherReportFilters $filters, array $sections): array
    {
        $incomeTrends = $sections['income_trends'] ?? [];
        $attendance = $sections['attendance'] ?? [];
        $subscription = $sections['subscription'] ?? [];

        $totalStudents = $this->studentQueryService->totalLinkedStudents($teacher, $filters);
        $activeStudents = $this->studentQueryService->activeStudentsCount($teacher, $filters);
        $inactiveStudents = max(0, $totalStudents - $activeStudents);
        $inactiveStudentsRatio = $totalStudents > 0
            ? round(($inactiveStudents / $totalStudents) * 100, 2)
            : 0.0;

        return [
            'teacher_id' => $teacher->id,
            'income_change_pct' => $incomeTrends['summary']['change_pct'] ?? null,
            'income_direction' => $incomeTrends['summary']['direction'] ?? 'stable',
            'attendance_rate' => $attendance['overall_rate'] ?? 0,
            'attendance_direction' => $attendance['overall_direction'] ?? 'stable',
            'plan_usage_pct' => $subscription['usage_percentage'] ?? 0,
            'plan_expires_at' => $teacher->plan_expires_at?->toDateString(),
            'days_until_renewal' => $teacher->plan_expires_at
                ? (int) max(0, now()->diffInDays($teacher->plan_expires_at, false))
                : null,
            'total_students' => $totalStudents,
            'active_students' => $activeStudents,
            'inactive_students_ratio' => $inactiveStudentsRatio,
            'groups' => $attendance['by_group'] ?? [],
            'income_by_group' => $sections['group_breakdown']['groups'] ?? [],
        ];
    }
}
