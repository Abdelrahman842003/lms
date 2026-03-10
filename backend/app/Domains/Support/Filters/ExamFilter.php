<?php

declare(strict_types=1);

namespace App\Domains\Support\Filters;

use Illuminate\Database\Eloquent\Builder;

class ExamFilter extends BaseFilter
{
    protected function filterSearch(Builder $query, string $value): void
    {
        $query->where(function ($q) use ($value) {
            $q->where('title', 'like', "%{$value}%")
                ->orWhere('subject', 'like', "%{$value}%");
        });
    }

    protected function filterDateFrom(Builder $query, string $value): void
    {
        $query->whereDate('date', '>=', $value);
    }

    protected function filterDateTo(Builder $query, string $value): void
    {
        $query->whereDate('date', '<=', $value);
    }

    protected function filterGradeId(Builder $query, string $value): void
    {
        $query->where('grade_id', $value);
    }

    protected function filterGroupId(Builder $query, string $value): void
    {
        $query->where('group_id', $value);
    }
}
