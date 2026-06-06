<?php

declare(strict_types=1);

namespace App\Domains\Support\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TeacherProfileScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (app()->bound('currentProfile')) {
            $profile = app('currentProfile');
            $builder->where($model->getTable() . '.teacher_profile_id', $profile->id);
        }
    }
}
