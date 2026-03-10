<?php

declare(strict_types=1);

namespace App\Domains\Support\Filters;

use App\Domains\Videos\Enums\VideoStatus;
use Illuminate\Database\Eloquent\Builder;

class VideoFilter extends BaseFilter
{
    protected function filterSearch(Builder $query, string $value): void
    {
        $query->where('title', 'like', "%{$value}%");
    }

    protected function filterStatus(Builder $query, string $value): void
    {
        match ($value) {
            'published' => $query->where('status', VideoStatus::PUBLISHED),
            'draft' => $query->where('status', VideoStatus::DRAFT),
            'archived' => $query->where('status', VideoStatus::ARCHIVED),
            default => null,
        };
    }

    protected function filterOwnerId(Builder $query, string $value): void
    {
        $query->where('owner_id', $value);
    }

    protected function filterOwnerType(Builder $query, string $value): void
    {
        $query->where('owner_type', $value);
    }

    protected function filterGradeId(Builder $query, string $value): void
    {
        $query->where('grade_id', $value);
    }

    protected function filterGroupId(Builder $query, string $value): void
    {
        $query->whereHas('groupTargets', function ($q) use ($value) {
            $q->where('group_id', $value);
        });
    }
}
