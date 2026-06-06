<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Lectures\Models\LectureSession;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for LectureSession model.
 *
 * Handles authorization for lecture session operations.
 */
class LectureSessionPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'lecture-sessions';
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view sessions
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof LectureSession) {
            return false;
        }

        // Admins can view any session
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher/Secretary can view sessions for their lectures
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->lecture) {
            return $this->ownsProfileResource($teacher, $model->lecture->teacher_profile_id);
        }

        // Academy can view sessions for their lectures
        if ($user instanceof Academy && $model->lecture) {
            return $model->lecture->academy_id === $user->id;
        }

        // Students can view sessions for lectures they're enrolled in
        return true;
    }

    public function create($user): bool
    {
        // Teachers, Secretaries, and Academies can create sessions
        return $user instanceof Teacher 
            || $user instanceof Secretary 
            || $user instanceof Academy
            || $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof LectureSession) {
            return false;
        }

        // Admins can update any session
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher/Secretary can update sessions for their lectures
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->lecture) {
            return $this->ownsProfileResource($teacher, $model->lecture->teacher_profile_id);
        }

        // Academy can update sessions for their lectures
        if ($user instanceof Academy && $model->lecture) {
            return $model->lecture->academy_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        return $this->update($user, $model);
    }
}
