<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Models\Subscription;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Subscription model.
 *
 * Handles authorization for subscription operations.
 */
class SubscriptionPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'subscriptions';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof Subscription) {
            return false;
        }

        // Academy owns their subscriptions
        if ($user instanceof Academy) {
            return $model->academy_id === $user->id;
        }

        // Teacher owns their subscriptions
        if ($user instanceof Teacher) {
            return $this->ownsProfileResource($user, $model->teacher_profile_id);
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // Admins, Teachers, and Academies can view subscriptions
        return $user instanceof Admin || $user instanceof Teacher || $user instanceof Academy;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof Subscription) {
            return false;
        }

        // Admins can view any subscription
        if ($user instanceof Admin) {
            return true;
        }

        // Academy can view their own subscriptions
        if ($user instanceof Academy) {
            return $model->academy_id === $user->id;
        }

        // Teacher can view their own subscriptions
        if ($user instanceof Teacher) {
            return $this->ownsProfileResource($user, $model->teacher_profile_id);
        }

        return false;
    }

    public function create($user): bool
    {
        // Admins, Teachers, and Academies can create subscriptions
        return $user instanceof Admin || $user instanceof Teacher || $user instanceof Academy;
    }

    public function update($user, Model $model): bool
    {
        // Only admins can update subscriptions
        return $user instanceof Admin;
    }

    public function delete($user, Model $model): bool
    {
        // Only admins can delete subscriptions
        return $user instanceof Admin;
    }
}
