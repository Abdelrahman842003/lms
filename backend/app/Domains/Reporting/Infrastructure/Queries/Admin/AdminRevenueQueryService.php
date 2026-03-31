<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Admin;

use App\Domains\Subscriptions\Models\PlatformPayment;
use App\Domains\Reporting\Domain\ValueObjects\ComparisonPeriod;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\SharedDateScope;
use Illuminate\Support\Facades\DB;

final class AdminRevenueQueryService
{
    public function __construct(
        private readonly SharedDateScope $dateScope,
    ) {}

    public function revenueThisMonth(): float
    {
        return (float) PlatformPayment::query()
            ->whereNotNull('confirmed_at')
            ->whereYear('confirmed_at', now()->year)
            ->whereMonth('confirmed_at', now()->month)
            ->sum('amount');
    }

    public function revenueForPeriod(ReportFilters $filters): float
    {
        return (float) PlatformPayment::query()
            ->whereNotNull('confirmed_at')
            ->tap(fn ($q) => $this->dateScope->apply($q, $filters->period, 'confirmed_at'))
            ->sum('amount');
    }

    public function revenueLastMonth(): float
    {
        $lastMonth = now()->subMonthNoOverflow();

        return (float) PlatformPayment::query()
            ->whereNotNull('confirmed_at')
            ->whereYear('confirmed_at', $lastMonth->year)
            ->whereMonth('confirmed_at', $lastMonth->month)
            ->sum('amount');
    }

    public function revenueMonthBefore(): float
    {
        $monthBefore = now()->subMonthsNoOverflow(2);

        return (float) PlatformPayment::query()
            ->whereNotNull('confirmed_at')
            ->whereYear('confirmed_at', $monthBefore->year)
            ->whereMonth('confirmed_at', $monthBefore->month)
            ->sum('amount');
    }

    public function revenueYearToDate(): float
    {
        return (float) PlatformPayment::query()
            ->whereNotNull('confirmed_at')
            ->whereYear('confirmed_at', now()->year)
            ->where('confirmed_at', '<=', now())
            ->sum('amount');
    }

    public function baselineRevenueThisMonth(?ComparisonPeriod $comparisonPeriod): ?float
    {
        if ($comparisonPeriod === null) {
            return null;
        }

        return (float) PlatformPayment::query()
            ->whereNotNull('confirmed_at')
            ->whereBetween('confirmed_at', [$comparisonPeriod->startAt, $comparisonPeriod->endAt])
            ->sum('amount');
    }

    public function baselineRevenueYearToDate(?ComparisonPeriod $comparisonPeriod): ?float
    {
        if ($comparisonPeriod === null) {
            return null;
        }

        return (float) PlatformPayment::query()
            ->whereNotNull('confirmed_at')
            ->whereBetween('confirmed_at', [$comparisonPeriod->startAt, $comparisonPeriod->endAt])
            ->sum('amount');
    }

    public function monthlyRevenueSeries(int $months = 12): array
    {
        $startDate = now()->subMonthsNoOverflow($months - 1)->startOfMonth();

        $results = PlatformPayment::query()
            ->whereNotNull('confirmed_at')
            ->where('confirmed_at', '>=', $startDate)
            ->select(
                DB::raw('YEAR(confirmed_at) as year'),
                DB::raw('MONTH(confirmed_at) as month'),
                DB::raw('SUM(amount) as total'),
            )
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        $series = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonthsNoOverflow($i)->startOfMonth();
            $year = $date->year;
            $month = $date->month;

            $match = $results->first(fn ($r) => (int) $r->year === $year && (int) $r->month === $month);

            $series[] = [
                'label' => $date->format('M Y'),
                'value' => $match ? (float) $match->total : 0.0,
            ];
        }

        return $series;
    }

    public function revenueByPlan(ReportFilters $filters): array
    {
        return PlatformPayment::query()
            ->whereNotNull('confirmed_at')
            ->tap(fn ($q) => $this->dateScope->apply($q, $filters->period, 'confirmed_at'))
            ->select('payable_type', DB::raw('SUM(amount) as total_revenue'), DB::raw('COUNT(*) as payment_count'))
            ->groupBy('payable_type')
            ->get()
            ->toArray();
    }
}
