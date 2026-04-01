<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Admin;

use App\Domains\Reporting\Application\Builders\BreakdownBuilder;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminRevenueQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminSubscriptionQueryService;

final class AdminPlanBreakdownBuilder
{
    public function __construct(
        private readonly AdminRevenueQueryService $revenueQuery,
        private readonly AdminSubscriptionQueryService $subscriptionQuery,
        private readonly BreakdownBuilder $breakdownBuilder,
    ) {}

    public function build(ReportFilters $filters): array
    {
        $grouped = $this->subscriptionQuery->getSubscriptionsGroupedByPlan($filters);
        $revenueByPlan = $this->revenueQuery->revenueByPlan($filters);

        $revenueMap = [];
        foreach ($revenueByPlan as $rev) {
            $payableType = $rev['payable_type'] ?? '';
            if (str_contains($payableType, 'Teacher')) {
                $revenueMap['teacher'] = (float) ($rev['total_revenue'] ?? 0);
            } elseif (str_contains($payableType, 'Academy')) {
                $revenueMap['academy'] = (float) ($rev['total_revenue'] ?? 0);
            }
        }

        $rows = [];
        foreach ($grouped as $plan) {
            $type = $plan['type'];
            $totalSeats = $plan['total_seats'];
            $totalQuota = $plan['total_quota'];
            $avgUsagePct = $totalQuota > 0 ? round(($totalSeats / $totalQuota) * 100, 1) : 0.0;

            $rows[] = [
                'plan_type' => $type,
                'subscription_count' => $plan['count'],
                'total_seats' => $totalSeats,
                'total_quota' => $totalQuota,
                'total_revenue' => $plan['total_revenue'],
                'avg_usage_pct' => $avgUsagePct,
                'external_revenue' => $revenueMap[$type] ?? 0.0,
            ];
        }

        $schema = [
            'plan_type' => 'string',
            'subscription_count' => 'number',
            'total_seats' => 'number',
            'total_quota' => 'number',
            'total_revenue' => 'number',
            'avg_usage_pct' => 'number',
            'external_revenue' => 'number',
        ];

        return $this->breakdownBuilder->build(
            rows: $rows,
            schema: $schema,
            sort: ['column' => 'total_revenue', 'direction' => 'desc'],
        );
    }
}
