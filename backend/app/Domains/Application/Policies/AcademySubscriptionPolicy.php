<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Subscriptions\Models\AcademySubscription;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for AcademySubscription model.
 *
 * Handles authorization for academy subscription operations.
 */
class AcademySubscriptionPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'academy-subscriptions';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof AcademySubscription) {
            return false;
        }

        // Academy owns their subscriptions
        if ($user instanceof Academy) {
            return $model->academy_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // Admins and Academies can view academy subscriptions
        return $user instanceof Admin || $user instanceof Academy;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof AcademySubscription) {
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

        return false;
    }

    public function create($user): bool
    {
        // Admins and Academies can create subscriptions
        return $user instanceof Admin || $user instanceof Academy;
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
