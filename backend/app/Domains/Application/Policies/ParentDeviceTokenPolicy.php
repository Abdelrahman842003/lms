<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\ParentDeviceToken;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for ParentDeviceToken model.
 *
 * Handles authorization for parent device token operations.
 */
class ParentDeviceTokenPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'parent-device-tokens';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof ParentDeviceToken) {
            return false;
        }

        // Guardian owns their own device tokens
        if ($user instanceof Guardian) {
            return $model->parent_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // Admins can view all, Guardians can view their own
        return $user instanceof Admin || $user instanceof Guardian;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof ParentDeviceToken) {
            return false;
        }

        // Admins can view any token
        if ($user instanceof Admin) {
            return true;
        }

        // Guardians can view their own tokens
        if ($user instanceof Guardian) {
            return $model->parent_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Guardians can create their own device tokens
        return $user instanceof Guardian || $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof ParentDeviceToken) {
            return false;
        }

        // Admins can update any token
        if ($user instanceof Admin) {
            return true;
        }

        // Guardians can update their own tokens
        if ($user instanceof Guardian) {
            return $model->parent_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        return $this->update($user, $model);
    }
}
