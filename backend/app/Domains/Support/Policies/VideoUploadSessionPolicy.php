<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Models\VideoUploadSession;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoUploadSession model.
 *
 * Handles authorization for video upload session operations.
 */
class VideoUploadSessionPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-upload-sessions';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof VideoUploadSession) {
            return false;
        }

        // Teacher owns their upload sessions
        if ($user instanceof Teacher) {
            return $model->teacher_id === $user->id;
        }

        // Academy owns their upload sessions
        if ($user instanceof Academy) {
            return $model->academy_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // Admins, Teachers, Secretaries, and Academies can view upload sessions
        return $user instanceof Admin 
            || $user instanceof Teacher 
            || $user instanceof Secretary 
            || $user instanceof Academy;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof VideoUploadSession) {
            return false;
        }

        // Admins can view any session
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher can view their own sessions
        if ($user instanceof Teacher) {
            return $model->teacher_id === $user->id;
        }

        // Secretary can view their teacher's sessions
        $teacher = $this->resolveTeacher($user);
        if ($teacher) {
            return $model->teacher_id === $teacher->id;
        }

        // Academy can view their own sessions
        if ($user instanceof Academy) {
            return $model->academy_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Teachers, Secretaries, and Academies can create upload sessions
        return $user instanceof Teacher 
            || $user instanceof Secretary 
            || $user instanceof Academy;
    }

    public function update($user, Model $model): bool
    {
        return $this->view($user, $model);
    }

    public function delete($user, Model $model): bool
    {
        if (!$model instanceof VideoUploadSession) {
            return false;
        }

        // Admins can delete any session
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher can delete their own sessions
        if ($user instanceof Teacher) {
            return $model->teacher_id === $user->id;
        }

        // Academy can delete their own sessions
        if ($user instanceof Academy) {
            return $model->academy_id === $user->id;
        }

        return false;
    }
}
