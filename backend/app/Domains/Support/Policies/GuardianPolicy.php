<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Student;
use App\Domains\Enrollments\Models\Enrollment;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Guardian model.
 *
 * Handles authorization for guardian (parent) management operations.
 */
class GuardianPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'guardians';
    }

    protected function isAcademyResource(): bool
    {
        return true;
    }

    public function viewAny($user): bool
    {
        // Admins can view all guardians
        return $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        // Admins can view any guardian
        if ($user instanceof Admin) {
            return true;
        }

        // Guardian can view their own profile
        if ($user instanceof Guardian && $model instanceof Guardian) {
            return $user->id === $model->id;
        }

        // Student can view their guardian
        if ($user instanceof Student && $model instanceof Guardian) {
            return $user->guardian_id === $model->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Admins can create guardians
        // Self-registration is handled separately in auth flow
        return $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        // Admins can update any guardian
        if ($user instanceof Admin) {
            return true;
        }

        // Guardian can update their own profile
        if ($user instanceof Guardian && $model instanceof Guardian) {
            return $user->id === $model->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Only admins can delete guardians
        return $user instanceof Admin;
    }
}
