<?php

declare(strict_types=1);

namespace App\Domains\Support\Filters;

use Illuminate\Database\Eloquent\Builder;

abstract class BaseFilter
{
    public function __construct(protected array $filters) {}

    public function apply(Builder $query): Builder
    {
        foreach ($this->filters as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $method = 'filter'.str_replace('_', '', ucwords($key, '_'));

            if (method_exists($this, $method)) {
                $this->$method($query, $value);
            }
        }

        return $query;
    }
}
