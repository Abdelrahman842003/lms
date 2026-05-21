<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\Enums\Direction;
use App\Domains\Reporting\Domain\Enums\ReportingPeriodPreset;
use App\Domains\Reporting\Domain\Services\TrendCalculationService;
use App\Domains\Reporting\Domain\ValueObjects\TeacherReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\TeacherScope;
use App\Domains\Reporting\Infrastructure\Queries\TeacherIncomeQueryService;
use Carbon\CarbonImmutable;

final readonly class TeacherIncomeTrendBuilder
{
    public function __construct(
        private TeacherIncomeQueryService $incomeQuery,
        private TrendCalculationService $trendService,
    ) {}

    public function build(Teacher $teacher, TeacherScope $scope, TeacherReportFilters $filters): array
    {
        $period = $filters->base->period;
        $months = 12; // Default fallback

        if ($period->preset) {
            $months = match ($period->preset) {
                ReportingPeriodPreset::Today,
                ReportingPeriodPreset::Last7Days,
                ReportingPeriodPreset::ThisMonth,
                ReportingPeriodPreset::LastMonth => 1,
                ReportingPeriodPreset::Last3Months => 3,
                ReportingPeriodPreset::ThisYear => (int) CarbonImmutable::now($period->timezone)->month,
                ReportingPeriodPreset::CustomRange => (int) $period->startAt->diffInMonths($period->endAt) + 1,
            };
        } else {
            $months = (int) $period->startAt->diffInMonths($period->endAt) + 1;
        }

        $months = max(1, min($months, 36));

        $buckets = $this->incomeQuery->monthlyIncomeBuckets($teacher, $filters, $months);
        $current = $this->incomeQuery->currentPeriodIncome($teacher, $filters);
        $baseline = $this->incomeQuery->previousPeriodIncome($teacher, $filters);

        $trend = $this->trendService->calculate($current, $baseline);

        $series = [];
        foreach ($buckets as $bucket) {
            $series[] = [
                'label' => $bucket['month_name'],
                'value' => $bucket['amount'],
            ];
        }

        $monthlyTable = [];
        $previousAmount = null;
        foreach ($buckets as $bucket) {
            $amount = $bucket['amount'];
            $changePct = null;
            $direction = Direction::Stable->value;

            if ($previousAmount !== null && $previousAmount > 0) {
                $changePct = round((($amount - $previousAmount) / $previousAmount) * 100, 2);
                $direction = abs($changePct) <= 0.5
                    ? Direction::Stable->value
                    : ($changePct > 0 ? Direction::Up->value : Direction::Down->value);
            }

            $monthlyTable[] = [
                'month' => $bucket['month'],
                'month_name' => $bucket['month_name'],
                'amount' => $amount,
                'previous_amount' => $previousAmount,
                'change_pct' => $changePct,
                'direction' => $direction,
            ];

            $previousAmount = $amount;
        }

        return [
            'summary' => [
                'current' => $current,
                'baseline' => $baseline,
                'change_pct' => $trend['change_pct'],
                'direction' => $trend['direction']->value,
            ],
            'series' => $series,
            'monthly_table' => $monthlyTable,
        ];
    }
}
