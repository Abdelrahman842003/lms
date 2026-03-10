<?php

declare(strict_types=1);

namespace App\Domains\Support\Filters;

use Illuminate\Database\Eloquent\Builder;

class GroupFilter extends BaseFilter
{
    protected function filterSearch(Builder $query, string $value): void
    {
        $query->where('name', 'like', "%{$value}%");
    }

    protected function filterGradeId(Builder $query, string $value): void
    {
        $query->where('grade_id', $value);
    }
}
