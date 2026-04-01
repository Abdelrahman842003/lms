<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Admin;

use App\Domains\Reporting\Domain\DTO\TrendMetricResult;
use App\Domains\Reporting\Domain\Services\TrendCalculationService;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminRevenueQueryService;

final class AdminRevenueTrendBuilder
{
    public function __construct(
        private readonly AdminRevenueQueryService $revenueQuery,
        private readonly TrendCalculationService $trendService,
    ) {}

    public function build(ReportFilters $filters): array
    {
        $series = $this->revenueQuery->monthlyRevenueSeries(12);
        $current = $this->revenueQuery->revenueForPeriod($filters);
        $baseline = $filters->comparisonPeriod
            ? $this->revenueQuery->baselineRevenueThisMonth($filters->comparisonPeriod)
            : $this->revenueQuery->revenueLastMonth();

        $trend = $this->trendService->calculate($current, $baseline);

        $trendResult = new TrendMetricResult(
            series: $series,
            current: $current,
            baseline: $baseline,
            changePct: $trend['change_pct'],
            direction: $trend['direction'],
        );

        $result = $trendResult->toArray();
        $result['revenue_this_month'] = $current;
        $result['revenue_last_month'] = $baseline;
        $result['revenue_month_before'] = $this->revenueQuery->revenueMonthBefore();
        $result['revenue_ytd'] = $this->revenueQuery->revenueYearToDate();

        return $result;
    }
}
