<?php

declare(strict_types=1);

namespace App\Domains\Application\Filters;

use Illuminate\Database\Eloquent\Builder;

class EnrollmentFilter extends BaseFilter
{
    protected function filterSearch(Builder $query, string $value): void
    {
        $query->whereHas('student', function ($q) use ($value) {
            $q->where('name', 'like', "%{$value}%")
                ->orWhere('phone', 'like', "%{$value}%");
        });
    }

    protected function filterStatus(Builder $query, string $value): void
    {
        match ($value) {
            'active' => $query->where('is_active', true),
            'inactive' => $query->where('is_active', false),
            default => null,
        };
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
