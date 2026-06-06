<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Policies;

use App\Domains\Application\Policies\BasePolicy;
use App\Domains\Enrollments\Models\Enrollment;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Enrollment model.
 *
 * Centralizes authorization logic for enrollment CRUD operations,
 * supporting Teacher, Academy, and Secretary users.
 */
class EnrollmentPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'enrollments';
    }

    /**
     * Determine whether the user can view the enrollment.
     */
    public function view($user, Model $model): bool
    {
        if (!$model instanceof Enrollment) {
            return false;
        }

        if ($this->isAcademy($user)) {
            return $model->academy_id === $user->id;
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can update the enrollment.
     */
    public function update($user, Model $model): bool
    {
        if (!$model instanceof Enrollment) {
            return false;
        }

        if ($this->isAcademy($user)) {
            return $model->academy_id === $user->id;
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can delete the enrollment.
     */
    public function delete($user, Model $model): bool
    {
        if (!$model instanceof Enrollment) {
            return false;
        }

        if ($this->isAcademy($user)) {
            return $model->academy_id === $user->id;
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can toggle the enrollment status.
     */
    public function toggleStatus($user, Enrollment $enrollment): bool
    {
        if ($this->isAcademy($user)) {
            return $enrollment->academy_id === $user->id;
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $enrollment->teacher_profile_id);
    }

    /**
     * Determine whether the user can activate the enrollment.
     */
    public function activate($user, Enrollment $enrollment): bool
    {
        if ($this->isAcademy($user)) {
            return $enrollment->academy_id === $user->id;
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $enrollment->teacher_profile_id);
    }
}

