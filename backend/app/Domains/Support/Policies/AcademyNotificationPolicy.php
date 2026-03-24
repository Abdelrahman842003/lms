<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Notifications\Models\AcademyNotification;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for AcademyNotification model.
 *
 * Handles authorization for academy notification operations.
 */
class AcademyNotificationPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'academy-notifications';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof AcademyNotification) {
            return false;
        }

        // Academy owns their notifications
        if ($user instanceof Academy) {
            return $model->academy_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // Admins and Academies can view notifications
        return $user instanceof Admin || $user instanceof Academy;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof AcademyNotification) {
            return false;
        }

        // Admins can view any notification
        if ($user instanceof Admin) {
            return true;
        }

        // Academy can view their own notifications
        if ($user instanceof Academy) {
            return $model->academy_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Admins and Academies can create notifications
        return $user instanceof Admin || $user instanceof Academy;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof AcademyNotification) {
            return false;
        }

        // Admins can update any notification
        if ($user instanceof Admin) {
            return true;
        }

        // Academy can update their own notifications
        if ($user instanceof Academy) {
            return $model->academy_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        return $this->update($user, $model);
    }
}
