<?php

declare(strict_types=1);

namespace App\Domains\Exams\Policies;

use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Exams\Models\Exam;

/**
 * Authorization policy for Exam model.
 *
 * Centralizes authorization logic for exam CRUD, results viewing, and copying.
 * Supports both Teacher and Secretary users via resolveTeacher().
 */
class ExamPolicy
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
     * Determine whether the user can view the exam.
     */
    public function view(Teacher|Secretary $user, Exam $exam): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $exam->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can update the exam.
     */
    public function update(Teacher|Secretary $user, Exam $exam): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $exam->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can delete the exam.
     */
    public function delete(Teacher|Secretary $user, Exam $exam): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $exam->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can view exam results.
     */
    public function viewResults(Teacher|Secretary $user, Exam $exam): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $exam->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can copy the exam.
     */
    public function copy(Teacher|Secretary $user, Exam $exam): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $exam->teacher_id === $teacher->id;
    }
}
