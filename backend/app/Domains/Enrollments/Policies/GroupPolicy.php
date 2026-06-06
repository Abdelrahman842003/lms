<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Policies;

use App\Domains\Application\Policies\BasePolicy;
use App\Domains\Enrollments\Models\Group;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Group model.
 *
 * Centralizes authorization logic for group CRUD operations,
 * supporting both Teacher and Secretary users via resolveTeacher().
 */
class GroupPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'groups';
    }

    /**
     * Determine whether the user can view the group.
     */
    public function view($user, Model $model): bool
    {
        if (!$model instanceof Group) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can update the group.
     */
    public function update($user, Model $model): bool
    {
        if (!$model instanceof Group) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can delete the group.
     */
    public function delete($user, Model $model): bool
    {
        if (!$model instanceof Group) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }
}

