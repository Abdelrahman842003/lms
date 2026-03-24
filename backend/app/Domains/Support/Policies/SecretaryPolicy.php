<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Secretary model.
 *
 * Handles authorization for secretary management operations.
 */
class SecretaryPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'secretaries';
    }

    protected function isAcademyResource(): bool
    {
        return true;
    }

    public function viewAny($user): bool
    {
        // Admins, Academies, and Teachers can view secretaries
        return $user instanceof Admin || $user instanceof Academy || $user instanceof Teacher;
    }

    public function view($user, Model $model): bool
    {
        // Admins can view any secretary
        if ($user instanceof Admin) {
            return true;
        }

        // Academy can view secretaries associated with their teachers
        if ($user instanceof Academy && $model instanceof Secretary) {
            return $user->teachers()
                ->whereHas('secretaries', fn ($q) => $q->where('secretaries.id', $model->id))
                ->exists();
        }

        // Teacher can view their secretaries
        if ($user instanceof Teacher && $model instanceof Secretary) {
            return $user->secretaries()->where('secretaries.id', $model->id)->exists();
        }

        // Secretary can view their own profile
        if ($user instanceof Secretary && $model instanceof Secretary) {
            return $user->id === $model->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Admins, Academies, and Teachers can create secretaries
        return $user instanceof Admin || $user instanceof Academy || $user instanceof Teacher;
    }

    public function update($user, Model $model): bool
    {
        // Admins can update any secretary
        if ($user instanceof Admin) {
            return true;
        }

        // Academy can update secretaries associated with their teachers
        if ($user instanceof Academy && $model instanceof Secretary) {
            return $user->teachers()
                ->whereHas('secretaries', fn ($q) => $q->where('secretaries.id', $model->id))
                ->exists();
        }

        // Teacher can update their secretaries
        if ($user instanceof Teacher && $model instanceof Secretary) {
            return $user->secretaries()->where('secretaries.id', $model->id)->exists();
        }

        // Secretary can update their own profile
        if ($user instanceof Secretary && $model instanceof Secretary) {
            return $user->id === $model->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Admins can delete any secretary
        if ($user instanceof Admin) {
            return true;
        }

        // Academy can delete secretaries associated with their teachers
        if ($user instanceof Academy && $model instanceof Secretary) {
            return $user->teachers()
                ->whereHas('secretaries', fn ($q) => $q->where('secretaries.id', $model->id))
                ->exists();
        }

        // Teacher can delete their secretaries
        if ($user instanceof Teacher && $model instanceof Secretary) {
            return $user->secretaries()->where('secretaries.id', $model->id)->exists();
        }

        return false;
    }
}
