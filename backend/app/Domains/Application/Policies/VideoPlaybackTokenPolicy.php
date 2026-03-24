<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Models\VideoPlaybackToken;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoPlaybackToken model.
 *
 * Handles authorization for video playback token operations.
 */
class VideoPlaybackTokenPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-playback-tokens';
    }

    public function viewAny($user): bool
    {
        // Admins, Teachers, Secretaries, and Academies can view tokens
        return $user instanceof Admin 
            || $user instanceof Teacher 
            || $user instanceof Secretary 
            || $user instanceof Academy;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof VideoPlaybackToken) {
            return false;
        }

        // Admins can view any token
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher/Secretary can view tokens for their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $model->video->teacher_id === $teacher->id;
        }

        // Academy can view tokens for their academy's videos
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Tokens are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Tokens are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Tokens are cleaned up automatically
        return $user instanceof Admin;
    }
}
