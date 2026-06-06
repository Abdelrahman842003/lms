<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Policies;

use App\Domains\Application\Policies\BasePolicy;
use App\Domains\Lectures\Models\Lecture;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Lecture model.
 *
 * Centralizes authorization logic for lecture operations including
 * CRUD, attendance, QR code generation, and session management.
 * Supports Teacher, Secretary, and Academy users.
 */
class LecturePolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'lectures';
    }

    /**
     * Determine whether the user can create lectures.
     */
    public function create($user): bool
    {
        return $this->resolveTeacher($user) !== null;
    }

    /**
     * Determine whether the user can view the lecture.
     */
    public function view($user, Model $model): bool
    {
        if (!$model instanceof Lecture) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can update the lecture.
     */
    public function update($user, Model $model): bool
    {
        if (!$model instanceof Lecture) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can delete the lecture.
     */
    public function delete($user, Model $model): bool
    {
        if (!$model instanceof Lecture) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can toggle lecture active status.
     */
    public function toggleActive($user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $lecture->teacher_profile_id);
    }

    /**
     * Determine whether the user can end a lecture.
     */
    public function endLecture($user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $lecture->teacher_profile_id);
    }

    /**
     * Determine whether the user can view lecture attendees.
     */
    public function viewAttendees($user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $lecture->teacher_profile_id);
    }

    /**
     * Determine whether the user can export lecture attendees.
     */
    public function exportAttendees($user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $lecture->teacher_profile_id);
    }

    /**
     * Determine whether the user can cancel a lecture session.
     */
    public function cancelSession($user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $lecture->teacher_profile_id);
    }

    /**
     * Determine whether the user can generate attendance code for the lecture.
     */
    public function generateAttendanceCode($user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $lecture->teacher_profile_id);
    }

    /**
     * Determine whether the user can invalidate attendance code for the lecture.
     */
    public function invalidateAttendanceCode($user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $lecture->teacher_profile_id);
    }

    /**
     * Determine whether the user can record attendance for the lecture.
     */
    public function recordAttendance($user, Lecture $lecture): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $lecture->teacher_profile_id);
    }
}

