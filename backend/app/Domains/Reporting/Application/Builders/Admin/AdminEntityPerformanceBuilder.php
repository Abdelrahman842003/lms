<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Admin;

use App\Domains\Reporting\Application\Builders\BreakdownBuilder;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminEntityPerformanceQueryService;

final class AdminEntityPerformanceBuilder
{
    public function __construct(
        private readonly AdminEntityPerformanceQueryService $entityPerformanceQuery,
        private readonly BreakdownBuilder $breakdownBuilder,
    ) {}

    public function build(ReportFilters $filters): array
    {
        $topAcademies = $this->entityPerformanceQuery->topGrowingAcademies($filters);
        $topTeachers = $this->entityPerformanceQuery->topGrowingTeachers($filters);
        $attendanceDecline = $this->entityPerformanceQuery->academiesWithAttendanceDecline($filters);
        $revenueDecline = $this->entityPerformanceQuery->teachersWithRevenueDecline($filters);
        $nearLimit = $this->entityPerformanceQuery->entitiesNearLimit();

        return [
            'top_growing_academies' => $this->buildTable(
                $topAcademies,
                ['name' => 'string', 'student_count' => 'number', 'teacher_count' => 'number', 'plan_type' => 'string', 'usage_pct' => 'number'],
            ),
            'top_growing_teachers' => $this->buildTable(
                $topTeachers,
                ['name' => 'string', 'active_students' => 'number', 'plan_type' => 'string', 'usage_pct' => 'number'],
            ),
            'academies_attendance_decline' => $this->buildTable(
                $attendanceDecline,
                ['name' => 'string', 'current_attendances' => 'number', 'baseline_attendances' => 'number', 'change_pct' => 'number'],
            ),
            'teachers_revenue_decline' => $this->buildTable(
                $revenueDecline,
                ['name' => 'string', 'current_revenue' => 'number', 'baseline_revenue' => 'number', 'change_pct' => 'number'],
            ),
            'entities_near_limit' => $this->buildTable(
                $nearLimit,
                ['name' => 'string', 'type' => 'string', 'usage_pct' => 'number', 'plan_type' => 'string'],
            ),
        ];
    }

    private function buildTable(array $rows, array $schema): array
    {
        return $this->breakdownBuilder->build(rows: $rows, schema: $schema);
    }
}
