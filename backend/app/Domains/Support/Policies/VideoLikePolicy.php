<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Models\VideoLike;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoLike model.
 *
 * Handles authorization for video like operations.
 */
class VideoLikePolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-likes';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof VideoLike) {
            return false;
        }

        // Student owns their own likes
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view likes
        return true;
    }

    public function view($user, Model $model): bool
    {
        // All authenticated users can view likes
        return true;
    }

    public function create($user): bool
    {
        // Only students can like videos
        return $user instanceof Student;
    }

    public function update($user, Model $model): bool
    {
        // Likes cannot be updated, only toggled via delete/create
        return false;
    }

    public function delete($user, Model $model): bool
    {
        if (!$model instanceof VideoLike) {
            return false;
        }

        // Student can only delete (unlike) their own likes
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }
}
