<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Policies;

use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Lectures\Models\Lecture;

/**
 * Authorization policy for Lecture model.
 *
 * Centralizes authorization logic for lecture operations including
 * CRUD, attendance, QR code generation, and session management.
 * Supports both Teacher and Secretary users via resolveTeacher().
 */
class LecturePolicy
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
     * Determine whether the user can create lectures.
     */
    public function create(Teacher|Secretary $user): bool
    {
        return $this->resolveTeacher($user) !== null;
    }

    /**
     * Determine whether the user can view the lecture.
     */
    public function view(Teacher|Secretary $user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $lecture->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can update the lecture.
     */
    public function update(Teacher|Secretary $user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $lecture->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can delete the lecture.
     */
    public function delete(Teacher|Secretary $user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $lecture->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can toggle lecture active status.
     */
    public function toggleActive(Teacher|Secretary $user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $lecture->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can end a lecture.
     */
    public function endLecture(Teacher|Secretary $user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $lecture->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can view lecture attendees.
     */
    public function viewAttendees(Teacher|Secretary $user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $lecture->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can export lecture attendees.
     */
    public function exportAttendees(Teacher|Secretary $user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $lecture->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can cancel a lecture session.
     */
    public function cancelSession(Teacher|Secretary $user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $lecture->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can generate QR code for the lecture.
     */
    public function generateQrCode(Teacher|Secretary $user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $lecture->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can record attendance for the lecture.
     */
    public function recordAttendance(Teacher|Secretary $user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $lecture->teacher_id === $teacher->id;
    }
}
