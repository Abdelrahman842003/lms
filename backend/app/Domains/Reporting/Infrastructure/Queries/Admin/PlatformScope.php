<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Admin;

use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use Illuminate\Database\Eloquent\Builder;

final class PlatformScope
{
    public function applyEntityType(Builder $query, ReportFilters $filters, string $column = 'entity_type'): Builder
    {
        return $query->when(
            $filters->entityType,
            fn (Builder $q) => $q->where($column, $filters->entityType),
        );
    }

    public function applyPlanId(Builder $query, ReportFilters $filters, string $column = 'plan_id'): Builder
    {
        return $query->when(
            $filters->planId,
            fn (Builder $q) => $q->where($column, $filters->planId),
        );
    }

    public function applySubscriptionStatus(Builder $query, ReportFilters $filters, string $column = 'status'): Builder
    {
        return $query->when(
            $filters->subscriptionStatus,
            fn (Builder $q) => $q->where($column, $filters->subscriptionStatus),
        );
    }

    public function applyGrowthDirection(Builder $query, ReportFilters $filters, string $column = 'growth_direction'): Builder
    {
        return $query->when(
            $filters->growthDirection,
            fn (Builder $q) => $q->where($column, $filters->growthDirection),
        );
    }

    public function applyUsageThreshold(Builder $query, ReportFilters $filters, string $column = 'usage_percentage'): Builder
    {
        return $query->when(
            $filters->usageThreshold !== null,
            fn (Builder $q) => $q->where($column, '>=', $filters->usageThreshold),
        );
    }
}
