<?php

declare(strict_types=1);

namespace App\Domains\Application\Filters;

use Illuminate\Database\Eloquent\Builder;

class GradeFilter extends BaseFilter
{
    protected function filterSearch(Builder $query, string $value): void
    {
        $query->where('name', 'like', "%{$value}%");
    }
}
