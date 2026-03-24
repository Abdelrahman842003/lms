<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Models\TeacherSubscription;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for TeacherSubscription model.
 *
 * Handles authorization for teacher subscription operations.
 */
class TeacherSubscriptionPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'teacher-subscriptions';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof TeacherSubscription) {
            return false;
        }

        // Teacher owns their subscriptions
        if ($user instanceof Teacher) {
            return $model->teacher_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // Admins and Teachers can view teacher subscriptions
        return $user instanceof Admin || $user instanceof Teacher;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof TeacherSubscription) {
            return false;
        }

        // Admins can view any subscription
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher can view their own subscriptions
        if ($user instanceof Teacher) {
            return $model->teacher_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Admins and Teachers can create subscriptions
        return $user instanceof Admin || $user instanceof Teacher;
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
