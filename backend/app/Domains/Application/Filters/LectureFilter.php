<?php

declare(strict_types=1);

namespace App\Domains\Application\Filters;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class LectureFilter extends BaseFilter
{
    protected function filterSearch(Builder $query, string $value): void
    {
        $query->where('title', 'like', "%{$value}%");
    }

    protected function filterDateFrom(Builder $query, string $value): void
    {
        $query->whereDate('start_time', '>=', $value);
    }

    protected function filterDateTo(Builder $query, string $value): void
    {
        $query->whereDate('start_time', '<=', $value);
    }

    protected function filterGroupId(Builder $query, string $value): void
    {
        $query->where('group_id', $value);
    }

    protected function filterTeacherId(Builder $query, string $value): void
    {
        $query->where('teacher_id', $value);
    }

    protected function filterStatus(Builder $query, string $value): void
    {
        match ($value) {
            'today' => $query->where(fn ($q) => $q->whereDate('start_time', Carbon::today())
                ->orWhere(fn ($q) => $q->where('is_recurring', true)
                    ->whereJsonContains('recurrence_days', Carbon::now()->format('l'))
                )
            ),
            'upcoming' => $query->where('start_time', '>', now())->where('is_active', false),
            'ongoing' => $query->where(fn ($q) => $q->where('is_active', true)
                ->orWhere(fn ($q) => $q->where('start_time', '<=', now())->where('end_time', '>', now())
                )
            ),
            'finished' => $query->where('end_time', '<=', now())->where('is_active', false),
            'recurring' => $query->where('is_recurring', true),
            default => null,
        };
    }
}
