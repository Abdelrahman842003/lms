<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Models\VideoComment;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoComment model.
 *
 * Handles authorization for video comment operations.
 */
class VideoCommentPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-comments';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof VideoComment) {
            return false;
        }

        // Student owns their own comments
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view comments
        return true;
    }

    public function view($user, Model $model): bool
    {
        // All authenticated users can view comments on videos they have access to
        return true;
    }

    public function create($user): bool
    {
        // Students can create comments
        return $user instanceof Student;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof VideoComment) {
            return false;
        }

        // Student can update their own comments
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        // Teacher/Secretary can update comments on their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $this->ownsProfileResource($teacher, $model->video->teacher_profile_id);
        }

        // Academy can update comments on their academy's videos
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        if (!$model instanceof VideoComment) {
            return false;
        }

        // Student can delete their own comments
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        // Teacher/Secretary can delete comments on their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $this->ownsProfileResource($teacher, $model->video->teacher_profile_id);
        }

        // Academy can delete comments on their academy's videos
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }
}
