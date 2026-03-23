<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;

/**
 * Authorization policy for Enrollment model.
 *
 * Centralizes authorization logic for enrollment CRUD operations,
 * supporting Teacher, Academy, and Secretary users.
 */
class EnrollmentPolicy
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
     * Determine whether the user can view the enrollment.
     */
    public function view(Teacher|Secretary|Academy $user, Enrollment $enrollment): bool
    {
        if ($user instanceof Academy) {
            return $enrollment->academy_id === $user->id;
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && $enrollment->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can update the enrollment.
     */
    public function update(Teacher|Secretary|Academy $user, Enrollment $enrollment): bool
    {
        if ($user instanceof Academy) {
            return $enrollment->academy_id === $user->id;
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && $enrollment->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can delete the enrollment.
     */
    public function delete(Teacher|Secretary|Academy $user, Enrollment $enrollment): bool
    {
        if ($user instanceof Academy) {
            return $enrollment->academy_id === $user->id;
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && $enrollment->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can toggle the enrollment status.
     */
    public function toggleStatus(Teacher|Secretary|Academy $user, Enrollment $enrollment): bool
    {
        if ($user instanceof Academy) {
            return $enrollment->academy_id === $user->id;
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && $enrollment->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can activate the enrollment.
     */
    public function activate(Teacher|Secretary|Academy $user, Enrollment $enrollment): bool
    {
        if ($user instanceof Academy) {
            return $enrollment->academy_id === $user->id;
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && $enrollment->teacher_id === $teacher->id;
    }
}
