<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries;

use App\Domains\Reporting\Domain\ValueObjects\ReportingPeriod;
use Illuminate\Database\Eloquent\Builder;

final class SharedDateScope
{
    public function apply(Builder $query, ReportingPeriod $period, string $column = 'created_at'): Builder
    {
        return $query->whereBetween($column, [
            $period->startAt->toDateTimeString(),
            $period->endAt->toDateTimeString(),
        ]);
    }

    public function applyStart(Builder $query, ReportingPeriod $period, string $column = 'created_at'): Builder
    {
        return $query->where($column, '>=', $period->startAt->toDateTimeString());
    }

    public function applyEnd(Builder $query, ReportingPeriod $period, string $column = 'created_at'): Builder
    {
        return $query->where($column, '<=', $period->endAt->toDateTimeString());
    }

    public function applyDateRange(
        Builder $query,
        ReportingPeriod $period,
        string $startColumn = 'start_date',
        string $endColumn = 'end_date',
    ): Builder {
        return $query->where($startColumn, '<=', $period->endAt->toDateTimeString())
            ->where($endColumn, '>=', $period->startAt->toDateTimeString());
    }
}
