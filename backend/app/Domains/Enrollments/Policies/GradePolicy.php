<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Policies;

use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Grade;

/**
 * Authorization policy for Grade model.
 *
 * Centralizes authorization logic for grade CRUD operations,
 * supporting both Teacher and Secretary users via resolveTeacher().
 */
class GradePolicy
{
    /**
     * Resolve the effective teacher from the user.
     */
    private function resolveTeacher(Teacher|Secretary $user): ?Teacher
    {
        if ($user instanceof Teacher) {
            return $user;
        }

        if ($user instanceof Secretary) {
            return $user->teachers()->first();
        }

        return null;
    }

    /**
     * Determine whether the user can view the grade.
     */
    public function view(Teacher|Secretary $user, Grade $grade): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $grade->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can update the grade.
     */
    public function update(Teacher|Secretary $user, Grade $grade): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $grade->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can delete the grade.
     */
    public function delete(Teacher|Secretary $user, Grade $grade): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $grade->teacher_id === $teacher->id;
    }
}
