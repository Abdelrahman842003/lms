<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Teacher model.
 *
 * Handles authorization for teacher management operations.
 */
class TeacherPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'teachers';
    }

    protected function isAcademyResource(): bool
    {
        return true;
    }

    public function viewAny($user): bool
    {
        // Admins and Academies can view teachers
        return $user instanceof Admin || $user instanceof Academy;
    }

    public function view($user, Model $model): bool
    {
        // Admins can view any teacher
        if ($user instanceof Admin) {
            return true;
        }

        // Academy can view teachers associated with them
        if ($user instanceof Academy && $model instanceof Teacher) {
            return $user->teachers()->where('teachers.id', $model->id)->exists();
        }

        // Teacher can view their own profile
        if ($user instanceof Teacher && $model instanceof Teacher) {
            return $user->id === $model->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Only admins can create teachers directly
        return $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        // Admins can update any teacher
        if ($user instanceof Admin) {
            return true;
        }

        // Academy can update teachers associated with them
        if ($user instanceof Academy && $model instanceof Teacher) {
            return $user->teachers()->where('teachers.id', $model->id)->exists();
        }

        // Teacher can update their own profile
        if ($user instanceof Teacher && $model instanceof Teacher) {
            return $user->id === $model->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Only admins can delete teachers
        return $user instanceof Admin;
    }
}
