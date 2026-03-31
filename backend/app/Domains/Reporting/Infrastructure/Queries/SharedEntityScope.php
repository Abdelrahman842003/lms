<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries;

use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use Illuminate\Database\Eloquent\Builder;

final class SharedEntityScope
{
    public function apply(Builder $query, ReportFilters $filters): Builder
    {
        return $query
            ->when($filters->entityType, fn (Builder $q) => $q->where('entity_type', $filters->entityType))
            ->when($filters->planId, fn (Builder $q) => $q->where('plan_id', $filters->planId))
            ->when($filters->subscriptionStatus, fn (Builder $q) => $q->where('subscription_status', $filters->subscriptionStatus))
            ->when($filters->growthDirection, fn (Builder $q) => $q->where('growth_direction', $filters->growthDirection))
            ->when(
                $filters->usageThreshold !== null,
                fn (Builder $q) => $q->where('usage_percentage', '>=', $filters->usageThreshold),
            );
    }

    public function applyEntityType(Builder $query, ?string $entityType, string $column = 'entity_type'): Builder
    {
        return $query->when($entityType, fn (Builder $q) => $q->where($column, $entityType));
    }

    public function applyPlanId(Builder $query, ?int $planId, string $column = 'plan_id'): Builder
    {
        return $query->when($planId, fn (Builder $q) => $q->where($column, $planId));
    }

    public function applySubscriptionStatus(Builder $query, ?string $status, string $column = 'subscription_status'): Builder
    {
        return $query->when($status, fn (Builder $q) => $q->where($column, $status));
    }
}
