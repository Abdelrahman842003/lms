<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Subscriptions\Models\PaymentLog;
use Carbon\CarbonImmutable;

final class TeacherIncomeQueryService
{
    public function currentPeriodIncome(Teacher $teacher, ReportFilters $filters): float
    {
        return (float) PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$filters->period->startAt, $filters->period->endAt])
            ->sum('amount');
    }

    public function previousPeriodIncome(Teacher $teacher, ReportFilters $filters): float
    {
        if (!$filters->hasComparison() || $filters->comparisonPeriod === null) {
            $periodStart = $filters->period->startAt;
            $duration = $filters->period->durationInDays();
            $compStart = $periodStart->subDays($duration)->startOfDay();
            $compEnd = $periodStart->subDay()->endOfDay();

            return (float) PaymentLog::where('teacher_id', $teacher->id)
                ->where('status', 'confirmed')
                ->whereBetween('confirmed_at', [$compStart, $compEnd])
                ->sum('amount');
        }

        return (float) PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$filters->comparisonPeriod->startAt, $filters->comparisonPeriod->endAt])
            ->sum('amount');
    }

    public function yearToDateIncome(Teacher $teacher, ReportFilters $filters): float
    {
        $yearStart = $filters->period->startAt->startOfYear();
        $yearEnd = $filters->period->endAt;

        return (float) PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$yearStart, $yearEnd])
            ->sum('amount');
    }

    public function monthlyIncomeBuckets(Teacher $teacher, ReportFilters $filters, int $months = 12): array
    {
        $buckets = [];
        $endMonth = $filters->period->endAt->startOfMonth();
        $startMonth = $endMonth->subMonthsNoOverflow($months - 1)->startOfMonth();

        for ($i = 0; $i < $months; $i++) {
            $monthStart = $startMonth->addMonthsNoOverflow($i);
            $monthEnd = $monthStart->endOfMonth();

            $amount = (float) PaymentLog::where('teacher_id', $teacher->id)
                ->where('status', 'confirmed')
                ->whereBetween('confirmed_at', [$monthStart, $monthEnd])
                ->sum('amount');

            $buckets[] = [
                'month' => $monthStart->format('Y-m'),
                'month_name' => $monthStart->format('M Y'),
                'amount' => $amount,
            ];
        }

        return $buckets;
    }
}
