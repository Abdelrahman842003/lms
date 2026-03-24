<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Models\VideoAccessLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoAccessLog model.
 *
 * Handles authorization for video access log operations.
 * Access logs are read-only audit records.
 */
class VideoAccessLogPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-access-logs';
    }

    public function viewAny($user): bool
    {
        // Admins, Teachers, Secretaries, and Academies can view access logs
        return $user instanceof Admin 
            || $user instanceof Teacher 
            || $user instanceof Secretary 
            || $user instanceof Academy;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof VideoAccessLog) {
            return false;
        }

        // Admins can view any log
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher/Secretary can view logs for their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $model->video->teacher_id === $teacher->id;
        }

        // Academy can view logs for their academy's videos
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Access logs are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Access logs are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Access logs should not be deleted (audit trail)
        return $user instanceof Admin;
    }
}
