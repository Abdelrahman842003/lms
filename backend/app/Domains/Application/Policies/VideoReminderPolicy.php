<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Models\VideoReminder;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoReminder model.
 *
 * Handles authorization for video reminder operations.
 */
class VideoReminderPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-reminders';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof VideoReminder) {
            return false;
        }

        // Student owns their own reminders
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // Students can view their reminders, Admins can view all
        return $user instanceof Student || $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof VideoReminder) {
            return false;
        }

        // Admins can view any reminder
        if ($user instanceof Admin) {
            return true;
        }

        // Students can view their own reminders
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Only students can create reminders
        return $user instanceof Student;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof VideoReminder) {
            return false;
        }

        // Students can update their own reminders
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        if (!$model instanceof VideoReminder) {
            return false;
        }

        // Admins can delete any reminder
        if ($user instanceof Admin) {
            return true;
        }

        // Students can delete their own reminders
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }
}
