<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Models\VideoAccessGrant;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoAccessGrant model.
 *
 * Handles authorization for video access grant operations.
 */
class VideoAccessGrantPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-access-grants';
    }

    public function viewAny($user): bool
    {
        // Teachers, Secretaries, and Academies can view access grants
        return $user instanceof Teacher || $user instanceof Secretary || $user instanceof Academy;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof VideoAccessGrant) {
            return false;
        }

        // Teacher/Secretary can view grants for their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $model->video->teacher_id === $teacher->id;
        }

        // Academy can view grants for their academy's videos
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Teachers, Secretaries, and Academies can create access grants
        return $user instanceof Teacher || $user instanceof Secretary || $user instanceof Academy;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof VideoAccessGrant) {
            return false;
        }

        // Teacher/Secretary can update grants for their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $model->video->teacher_id === $teacher->id;
        }

        // Academy can update grants for their academy's videos
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        if (!$model instanceof VideoAccessGrant) {
            return false;
        }

        // Teacher/Secretary can delete grants for their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $model->video->teacher_id === $teacher->id;
        }

        // Academy can delete grants for their academy's videos
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }
}
