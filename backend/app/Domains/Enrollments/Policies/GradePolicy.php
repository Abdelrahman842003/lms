<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Policies;

use App\Domains\Application\Policies\BasePolicy;
use App\Domains\Enrollments\Models\Grade;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Grade model.
 *
 * Centralizes authorization logic for grade CRUD operations,
 * supporting both Teacher and Secretary users via resolveTeacher().
 */
class GradePolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'grades';
    }

    /**
     * Determine whether the user can view the grade.
     */
    public function view($user, Model $model): bool
    {
        if (!$model instanceof Grade) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can update the grade.
     */
    public function update($user, Model $model): bool
    {
        if (!$model instanceof Grade) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can delete the grade.
     */
    public function delete($user, Model $model): bool
    {
        if (!$model instanceof Grade) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }
}

