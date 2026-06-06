<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\ValueObjects\TeacherReportFilters;
use App\Domains\Subscriptions\Models\PaymentLog;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class TeacherIncomeQueryService
{
    public function currentPeriodIncome($teacher, TeacherReportFilters $filters): float
    {
        $query = $teacher->paymentLogs()
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$filters->base->period->startAt, $filters->base->period->endAt]);
        
        if ($filters->groupId) {
            $query->whereHas('enrollment', fn($q) => $q->where('group_id', $filters->groupId));
        }

        return (float) $query->sum('amount');
    }

    public function previousPeriodIncome($teacher, TeacherReportFilters $filters): float
    {
        $query = $teacher->paymentLogs()
            ->where('status', 'confirmed');
        
        if ($filters->groupId) {
            $query->whereHas('enrollment', fn($q) => $q->where('group_id', $filters->groupId));
        }

        if (!$filters->base->hasComparison() || $filters->base->comparisonPeriod === null) {
            $periodStart = $filters->base->period->startAt;
            $duration = $filters->base->period->durationInDays();
            $compStart = $periodStart->subDays($duration)->startOfDay();
            $compEnd = $periodStart->subDay()->endOfDay();

            return (float) $query->whereBetween('confirmed_at', [$compStart, $compEnd])->sum('amount');
        }

        return (float) $query->whereBetween('confirmed_at', [$filters->base->comparisonPeriod->startAt, $filters->base->comparisonPeriod->endAt])->sum('amount');
    }

    public function yearToDateIncome($teacher, TeacherReportFilters $filters): float
    {
        $yearStart = $filters->base->period->startAt->startOfYear();
        $yearEnd = $filters->base->period->endAt;

        $query = $teacher->paymentLogs()
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$yearStart, $yearEnd]);
        
        if ($filters->groupId) {
            $query->whereHas('enrollment', fn($q) => $q->where('group_id', $filters->groupId));
        }

        return (float) $query->sum('amount');
    }

    public function monthlyIncomeBuckets($teacher, TeacherReportFilters $filters, int $months = 12): array
    {
        $endMonth = $filters->base->period->endAt->startOfMonth();
        $startMonth = $endMonth->subMonthsNoOverflow($months - 1)->startOfMonth();

        $query = $teacher->paymentLogs()
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startMonth, $endMonth->endOfMonth()]);
        
        if ($filters->groupId) {
            $query->whereHas('enrollment', fn($q) => $q->where('group_id', $filters->groupId));
        }

        // Single grouped query instead of one query-per-month
        $rows = $query->select(
                DB::raw("DATE_FORMAT(confirmed_at, '%Y-%m') as month"),
                DB::raw('SUM(amount) as amount'),
            )
            ->groupBy(DB::raw("DATE_FORMAT(confirmed_at, '%Y-%m')"))
            ->get()
            ->keyBy('month');

        $buckets = [];
        for ($i = 0; $i < $months; $i++) {
            $monthStart = $startMonth->addMonthsNoOverflow($i);
            $monthKey = $monthStart->format('Y-m');
            $row = $rows->get($monthKey);

            $buckets[] = [
                'month' => $monthKey,
                'month_name' => $monthStart->format('M Y'),
                'amount' => (float) ($row?->amount ?? 0),
            ];
        }

        return $buckets;
    }
}
