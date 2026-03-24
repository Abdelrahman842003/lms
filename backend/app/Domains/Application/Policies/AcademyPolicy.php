<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Academy model.
 *
 * Handles authorization for academy management operations.
 */
class AcademyPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'academies';
    }

    protected function isAcademyResource(): bool
    {
        return false; // Academies manage themselves, not academy-owned resources
    }

    public function viewAny($user): bool
    {
        // Only admins can view all academies
        return $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        // Admins can view any academy
        if ($user instanceof Admin) {
            return true;
        }

        // Academy can view their own profile
        if ($user instanceof Academy && $model instanceof Academy) {
            return $user->id === $model->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Only admins can create academies
        return $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        // Admins can update any academy
        if ($user instanceof Admin) {
            return true;
        }

        // Academy can update their own profile
        if ($user instanceof Academy && $model instanceof Academy) {
            return $user->id === $model->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Only admins can delete academies
        return $user instanceof Admin;
    }
}
