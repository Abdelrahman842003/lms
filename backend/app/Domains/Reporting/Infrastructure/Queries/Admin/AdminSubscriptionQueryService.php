<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Admin;

use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Reporting\Domain\ValueObjects\ComparisonPeriod;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\SharedDateScope;
use Illuminate\Support\Facades\DB;

final class AdminSubscriptionQueryService
{
    public function __construct(
        private readonly SharedDateScope $dateScope,
    ) {}

    public function countActive(): int
    {
        return Subscription::query()
            ->whereIn('status', [SubscriptionStatus::ACTIVE, SubscriptionStatus::PAID])
            ->count();
    }

    public function countExpired(): int
    {
        return Subscription::query()
            ->where('status', SubscriptionStatus::EXPIRED)
            ->count();
    }

    public function countBaselineActive(?ComparisonPeriod $comparisonPeriod): ?int
    {
        if ($comparisonPeriod === null) {
            return null;
        }

        return Subscription::query()
            ->where('created_at', '<=', $comparisonPeriod->endAt)
            ->whereIn('status', [SubscriptionStatus::ACTIVE, SubscriptionStatus::PAID])
            ->count();
    }

    public function countBaselineExpired(?ComparisonPeriod $comparisonPeriod): ?int
    {
        if ($comparisonPeriod === null) {
            return null;
        }

        return Subscription::query()
            ->where('created_at', '<=', $comparisonPeriod->endAt)
            ->where('status', SubscriptionStatus::EXPIRED)
            ->count();
    }

    public function countRenewalDueSoon(int $daysAhead = 30): int
    {
        return Subscription::query()
            ->whereIn('status', [SubscriptionStatus::ACTIVE, SubscriptionStatus::PAID])
            ->whereNotNull('month')
            ->whereBetween('month', [now()->startOfDay(), now()->addDays($daysAhead)->endOfDay()])
            ->count();
    }

    public function countNewlyActivated(ReportFilters $filters): int
    {
        return Subscription::query()
            ->whereIn('status', [SubscriptionStatus::ACTIVE, SubscriptionStatus::PAID])
            ->tap(fn ($q) => $this->dateScope->apply($q, $filters->period))
            ->count();
    }

    public function countChurned(ReportFilters $filters): int
    {
        return Subscription::query()
            ->where('status', SubscriptionStatus::EXPIRED)
            ->tap(fn ($q) => $this->dateScope->apply($q, $filters->period))
            ->count();
    }

    public function getPlanUsageDistribution(): array
    {
        return Subscription::query()
            ->select('type', DB::raw('COUNT(*) as count'))
            ->whereIn('status', [SubscriptionStatus::ACTIVE, SubscriptionStatus::PAID])
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();
    }

    public function getSubscriptionsGroupedByPlan(ReportFilters $filters): array
    {
        return Subscription::query()
            ->select('type', DB::raw('COUNT(*) as count'), DB::raw('SUM(seats_count) as total_seats'), DB::raw('SUM(amount_paid) as total_revenue'), DB::raw('SUM(quota_limit) as total_quota'))
            ->whereIn('status', [SubscriptionStatus::ACTIVE, SubscriptionStatus::PAID])
            ->groupBy('type')
            ->get()
            ->map(fn ($row) => [
                'type' => $row->type,
                'count' => (int) $row->count,
                'total_seats' => (int) $row->total_seats,
                'total_revenue' => (float) $row->total_revenue,
                'total_quota' => (int) ($row->total_quota ?? 0),
            ])
            ->toArray();
    }
}
