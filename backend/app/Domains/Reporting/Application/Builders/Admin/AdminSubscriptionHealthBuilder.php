<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Admin;

use App\Domains\Reporting\Domain\Services\KpiCardFactory;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminSubscriptionQueryService;

final class AdminSubscriptionHealthBuilder
{
    public function __construct(
        private readonly AdminSubscriptionQueryService $subscriptionQuery,
        private readonly KpiCardFactory $kpiFactory,
    ) {}

    public function build(ReportFilters $filters): array
    {
        $comparisonPeriod = $filters->comparisonPeriod;

        $activeKpi = $this->kpiFactory->make(
            'health_active',
            'Active Subscriptions',
            $this->subscriptionQuery->countActive(),
            $this->subscriptionQuery->countBaselineActive($comparisonPeriod),
        );

        $expiredKpi = $this->kpiFactory->make(
            'health_expired',
            'Expired Subscriptions',
            $this->subscriptionQuery->countExpired(),
            $this->subscriptionQuery->countBaselineExpired($comparisonPeriod),
        );

        $renewalKpi = $this->kpiFactory->make(
            'health_renewals_due',
            'Renewals Due Soon',
            $this->subscriptionQuery->countRenewalDueSoon(),
        );

        $newlyActivatedKpi = $this->kpiFactory->make(
            'health_newly_activated',
            'Newly Activated',
            $this->subscriptionQuery->countNewlyActivated($filters),
        );

        $churnedKpi = $this->kpiFactory->make(
            'health_churned',
            'Churned',
            $this->subscriptionQuery->countChurned($filters),
        );

        return [
            'kpis' => [
                $activeKpi->toArray(),
                $expiredKpi->toArray(),
                $renewalKpi->toArray(),
                $newlyActivatedKpi->toArray(),
                $churnedKpi->toArray(),
            ],
            'usage_distribution' => $this->subscriptionQuery->getPlanUsageDistribution(),
        ];
    }
}
