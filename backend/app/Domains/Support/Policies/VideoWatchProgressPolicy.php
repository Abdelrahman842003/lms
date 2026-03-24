<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Models\VideoWatchProgress;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoWatchProgress model.
 *
 * Handles authorization for video watch progress tracking.
 */
class VideoWatchProgressPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-watch-progress';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof VideoWatchProgress) {
            return false;
        }

        // Student owns their own watch progress
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view watch progress
        return true;
    }

    public function view($user, Model $model): bool
    {
        // Students can view their own progress
        if ($user instanceof Student && $model instanceof VideoWatchProgress) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Only students can create watch progress
        return $user instanceof Student;
    }

    public function update($user, Model $model): bool
    {
        // Students can only update their own progress
        if ($user instanceof Student && $model instanceof VideoWatchProgress) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Watch progress should not be deleted
        return false;
    }
}
