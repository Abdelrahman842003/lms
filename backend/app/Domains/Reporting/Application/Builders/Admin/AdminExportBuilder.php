<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Admin;

use App\Domains\Reporting\Application\Export\ExportPayloadBuilder;
use App\Domains\Reporting\Domain\DTO\ExportPayload;
use App\Domains\Reporting\Domain\DTO\KpiCardResult;
use App\Domains\Reporting\Domain\Services\KpiCardFactory;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminEntityQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminStudentActivityQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminSubscriptionQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminRevenueQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminEntityPerformanceQueryService;

final class AdminExportBuilder
{
    public function __construct(
        private readonly KpiCardFactory $kpiFactory,
        private readonly ExportPayloadBuilder $exportPayloadBuilder,
        private readonly AdminEntityQueryService $entityQuery,
        private readonly AdminStudentActivityQueryService $studentQuery,
        private readonly AdminSubscriptionQueryService $subscriptionQuery,
        private readonly AdminRevenueQueryService $revenueQuery,
        private readonly AdminEntityPerformanceQueryService $entityPerformanceQuery,
    ) {}

    public function build(ReportFilters $filters): array
    {
        $summaryKpis = $this->buildSummaryKpis($filters);
        $sectionBreakdowns = $this->buildSectionBreakdowns($filters);
        $detailedRows = $this->collectDetailedRows($filters);

        $payload = $this->exportPayloadBuilder->build(
            summaryKpis: $summaryKpis,
            breakdownData: $sectionBreakdowns,
            detailedRows: $detailedRows,
            filters: $filters,
        );

        return $payload->toArray();
    }

    /**
     * @return array<int, KpiCardResult>
     */
    private function buildSummaryKpis(ReportFilters $filters): array
    {
        $comparisonPeriod = $filters->comparisonPeriod;

        return [
            $this->kpiFactory->make(
                'total_academies',
                'Total Academies',
                $this->entityQuery->countAcademies(),
                $comparisonPeriod ? $this->entityQuery->countBaselineAcademies($comparisonPeriod) : null,
            ),
            $this->kpiFactory->make(
                'total_teachers',
                'Total Teachers',
                $this->entityQuery->countTeachers(),
                $comparisonPeriod ? $this->entityQuery->countBaselineTeachers($comparisonPeriod) : null,
            ),
            $this->kpiFactory->make(
                'total_linked_students',
                'Total Linked Students',
                $this->studentQuery->countLinkedStudents(),
                $comparisonPeriod ? $this->studentQuery->countBaselineLinkedStudents($comparisonPeriod) : null,
            ),
            $this->kpiFactory->make(
                'active_subscriptions',
                'Active Subscriptions',
                $this->subscriptionQuery->countActive(),
                $comparisonPeriod ? $this->subscriptionQuery->countBaselineActive($comparisonPeriod) : null,
            ),
            $this->kpiFactory->make(
                'expired_subscriptions',
                'Expired Subscriptions',
                $this->subscriptionQuery->countExpired(),
                $comparisonPeriod ? $this->subscriptionQuery->countBaselineExpired($comparisonPeriod) : null,
            ),
            $this->kpiFactory->make(
                'revenue_this_month',
                'Revenue This Month',
                $this->revenueQuery->revenueForPeriod($filters),
                $comparisonPeriod ? $this->revenueQuery->baselineRevenueThisMonth($comparisonPeriod) : null,
            ),
            $this->kpiFactory->make(
                'revenue_this_year',
                'Revenue This Year',
                $this->revenueQuery->revenueYearToDate(),
                $comparisonPeriod ? $this->revenueQuery->baselineRevenueYearToDate($comparisonPeriod) : null,
            ),
            $this->kpiFactory->make(
                'entities_near_limit',
                'Entities Near Plan Limit',
                $this->entityQuery->countEntitiesNearLimit(),
            ),
        ];
    }

    private function buildSectionBreakdowns(ReportFilters $filters): array
    {
        $revenueByPlan = $this->revenueQuery->revenueByPlan($filters);
        $usageDistribution = $this->subscriptionQuery->getPlanUsageDistribution();
        $rows = [];

        foreach (['teacher', 'academy'] as $type) {
            $totalRevenue = 0.0;
            foreach ($revenueByPlan as $rev) {
                $payableType = $rev['payable_type'] ?? '';
                $matches = ($type === 'teacher' && str_contains($payableType, 'Teacher'))
                    || ($type === 'academy' && str_contains($payableType, 'Academy'));
                if ($matches) {
                    $totalRevenue = (float) ($rev['total_revenue'] ?? 0);
                    break;
                }
            }
            $rows[] = [
                'plan_type' => $type,
                'subscription_count' => $usageDistribution[$type] ?? 0,
                'total_revenue' => $totalRevenue,
            ];
        }

        return $rows;
    }

    private function collectDetailedRows(ReportFilters $filters): array
    {
        $rows = [];

        foreach ($this->entityPerformanceQuery->topGrowingAcademies($filters) as $academy) {
            $rows[] = [
                'entity_type' => 'academy',
                'name' => $academy['name'],
                'student_count' => $academy['student_count'],
            ];
        }

        foreach ($this->entityPerformanceQuery->topGrowingTeachers($filters) as $teacher) {
            $rows[] = [
                'entity_type' => 'teacher',
                'name' => $teacher['name'],
                'active_students' => $teacher['active_students'],
            ];
        }

        return $rows;
    }
}
