<?php

declare(strict_types=1);

namespace App\Domains\Auth\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;

/**
 * Authorization policy for Student model.
 *
 * Centralizes authorization logic for student operations,
 * supporting Teacher, Academy, and Secretary users.
 */
class StudentPolicy
{
    /**
     * Bypass authorization for admins.
     */
    public function before($user, string $ability): ?bool
    {
        if ($user instanceof Admin) {
            return true;
        }

        return null;
    }

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
     * Determine whether the user can view the student.
     * Student must be enrolled with the teacher or academy.
     */
    public function view(Admin|Teacher|Secretary|Academy $user, Student $student): bool
    {
        if ($user instanceof Admin) {
            return true;
        }

        if ($user instanceof Academy) {
            return Enrollment::where('student_id', $student->id)
                ->where('academy_id', $user->id)
                ->exists();
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && Enrollment::where('student_id', $student->id)
            ->where('teacher_id', $teacher->id)
            ->exists();
    }

    /**
     * Determine whether the user can update the student.
     * Student must be enrolled with the teacher or academy.
     */
    public function update(Admin|Teacher|Secretary|Academy $user, Student $student): bool
    {
        if ($user instanceof Admin) {
            return true;
        }

        if ($user instanceof Academy) {
            return Enrollment::where('student_id', $student->id)
                ->where('academy_id', $user->id)
                ->exists();
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && Enrollment::where('student_id', $student->id)
            ->where('teacher_id', $teacher->id)
            ->exists();
    }

    /**
     * Determine whether the user can delete the student.
     * Student must be enrolled with the teacher or academy.
     */
    public function delete(Admin|Teacher|Secretary|Academy $user, Student $student): bool
    {
        if ($user instanceof Admin) {
            return true;
        }

        if ($user instanceof Academy) {
            return Enrollment::where('student_id', $student->id)
                ->where('academy_id', $user->id)
                ->exists();
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && Enrollment::where('student_id', $student->id)
            ->where('teacher_id', $teacher->id)
            ->exists();
    }

    /**
     * Determine whether the user can update permissions for the student.
     */
    public function updatePermissions(Admin|Teacher|Secretary|Academy $user, Student $student): bool
    {
        if ($user instanceof Admin) {
            return true;
        }

        if ($user instanceof Academy) {
            return Enrollment::where('student_id', $student->id)
                ->where('academy_id', $user->id)
                ->exists();
        }

        $teacher = $this->resolveTeacher($user);
        return $teacher && Enrollment::where('student_id', $student->id)
            ->where('teacher_id', $teacher->id)
            ->exists();
    }
}
