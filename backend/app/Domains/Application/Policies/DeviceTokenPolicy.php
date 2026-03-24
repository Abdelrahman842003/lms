<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\DeviceToken;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for DeviceToken model.
 *
 * Handles authorization for device token operations.
 */
class DeviceTokenPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'device-tokens';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof DeviceToken) {
            return false;
        }

        // Student owns their own device tokens
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // Admins can view all, Students can view their own
        return $user instanceof Admin || $user instanceof Student;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof DeviceToken) {
            return false;
        }

        // Admins can view any token
        if ($user instanceof Admin) {
            return true;
        }

        // Students can view their own tokens
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Students can create their own device tokens
        return $user instanceof Student || $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof DeviceToken) {
            return false;
        }

        // Admins can update any token
        if ($user instanceof Admin) {
            return true;
        }

        // Students can update their own tokens
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        return $this->update($user, $model);
    }
}
