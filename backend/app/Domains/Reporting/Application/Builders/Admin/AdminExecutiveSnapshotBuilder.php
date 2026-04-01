<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Admin;

use App\Domains\Reporting\Domain\DTO\KpiCardResult;
use App\Domains\Reporting\Domain\Services\KpiCardFactory;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminEntityQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminStudentActivityQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminSubscriptionQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminRevenueQueryService;

final class AdminExecutiveSnapshotBuilder
{
    public function __construct(
        private readonly KpiCardFactory $kpiFactory,
        private readonly AdminEntityQueryService $entityQuery,
        private readonly AdminStudentActivityQueryService $studentQuery,
        private readonly AdminSubscriptionQueryService $subscriptionQuery,
        private readonly AdminRevenueQueryService $revenueQuery,
    ) {}

    /**
     * @return array<int, KpiCardResult>
     */
    public function build(ReportFilters $filters): array
    {
        $comparisonPeriod = $filters->comparisonPeriod;

        return [
            $this->kpiFactory->make(
                'total_academies',
                'Total Academies',
                $this->entityQuery->countAcademies(),
                $this->entityQuery->countBaselineAcademies($comparisonPeriod),
                drilldownKey: 'academies_drilldown',
            ),
            $this->kpiFactory->make(
                'total_teachers',
                'Total Teachers',
                $this->entityQuery->countTeachers(),
                $this->entityQuery->countBaselineTeachers($comparisonPeriod),
                drilldownKey: 'teachers_drilldown',
            ),
            $this->kpiFactory->make(
                'total_linked_students',
                'Total Linked Students',
                $this->studentQuery->countLinkedStudents(),
                $this->studentQuery->countBaselineLinkedStudents($comparisonPeriod),
                drilldownKey: 'total_students_drilldown',
            ),
            $this->kpiFactory->make(
                'active_subscriptions',
                'Active Subscriptions',
                $this->subscriptionQuery->countActive(),
                $this->subscriptionQuery->countBaselineActive($comparisonPeriod),
                drilldownKey: 'subscription_usage_drilldown',
            ),
            $this->kpiFactory->make(
                'expired_subscriptions',
                'Expired Subscriptions',
                $this->subscriptionQuery->countExpired(),
                $this->subscriptionQuery->countBaselineExpired($comparisonPeriod),
                drilldownKey: 'subscription_usage_drilldown',
            ),
            $this->kpiFactory->make(
                'revenue_this_month',
                'Revenue This Month',
                $this->revenueQuery->revenueForPeriod($filters),
                $this->revenueQuery->baselineRevenueThisMonth($comparisonPeriod),
                drilldownKey: 'revenue_drilldown',
            ),
            $this->kpiFactory->make(
                'revenue_this_year',
                'Revenue This Year',
                $this->revenueQuery->revenueYearToDate(),
                $this->revenueQuery->baselineRevenueYearToDate($comparisonPeriod),
                drilldownKey: 'revenue_drilldown',
            ),
            $this->kpiFactory->make(
                'entities_near_limit',
                'Entities Near Plan Limit',
                $this->entityQuery->countEntitiesNearLimit(),
                null,
                statusColor: $this->resolveNearLimitColor($this->entityQuery->countEntitiesNearLimit()),
                drilldownKey: 'subscription_usage_drilldown',
            ),
        ];
    }

    private function resolveNearLimitColor(int $count): ?string
    {
        if ($count >= 10) {
            return 'red';
        }

        if ($count >= 5) {
            return 'yellow';
        }

        return null;
    }
}
