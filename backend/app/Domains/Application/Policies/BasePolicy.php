<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Database\Eloquent\Model;

/**
 * Abstract base policy providing common authorization patterns.
 *
 * This class provides a standardized approach to authorization across all models,
 * supporting permission-based access control and resource ownership checks.
 */
abstract class BasePolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can view any models.
     *
     * @param  mixed  $user  The authenticated user (Teacher, Academy, Secretary, Admin, etc.)
     */
    public function viewAny($user): bool
    {
        return $this->hasPermission($user, 'view');
    }

    /**
     * Determine if the user can view the model.
     *
     * @param  mixed  $user  The authenticated user
     * @param  Model  $model  The model being accessed
     */
    public function view($user, Model $model): bool
    {
        return $this->hasPermission($user, 'view')
            || $this->ownsResource($user, $model);
    }

    /**
     * Determine if the user can create models.
     *
     * @param  mixed  $user  The authenticated user
     */
    public function create($user): bool
    {
        return $this->hasPermission($user, 'create');
    }

    /**
     * Determine if the user can update the model.
     *
     * @param  mixed  $user  The authenticated user
     * @param  Model  $model  The model being accessed
     */
    public function update($user, Model $model): bool
    {
        return $this->hasPermission($user, 'update')
            || $this->ownsResource($user, $model);
    }

    /**
     * Determine if the user can delete the model.
     *
     * @param  mixed  $user  The authenticated user
     * @param  Model  $model  The model being accessed
     */
    public function delete($user, Model $model): bool
    {
        return $this->hasPermission($user, 'delete')
            || $this->ownsResource($user, $model);
    }

    /**
     * Determine if the user can restore the model.
     *
     * @param  mixed  $user  The authenticated user
     * @param  Model  $model  The model being accessed
     */
    public function restore($user, Model $model): bool
    {
        return $this->hasPermission($user, 'restore');
    }

    /**
     * Determine if the user can permanently delete the model.
     *
     * @param  mixed  $user  The authenticated user
     * @param  Model  $model  The model being accessed
     */
    public function forceDelete($user, Model $model): bool
    {
        return $this->hasPermission($user, 'force-delete');
    }

    /**
     * Check if user has the specific permission for this resource.
     *
     * @param  mixed  $user  The authenticated user
     * @param  string  $action  The action being performed (view, create, update, delete, etc.)
     */
    protected function hasPermission($user, string $action): bool
    {
        // Check if user has the spatie/laravel-permission trait/method
        if (method_exists($user, 'hasPermissionTo')) {
            $permission = $this->getResourceName() . '.' . $action;
            
            try {
                return $user->hasPermissionTo($permission);
            } catch (\Throwable) {
                // Permission doesn't exist, fall back to false
                return false;
            }
        }

        return false;
    }

    /**
     * Check if the user owns the resource.
     *
     * Override in child classes for custom ownership logic.
     *
     * @param  mixed  $user  The authenticated user
     * @param  Model  $model  The model being accessed
     */
    protected function ownsResource($user, Model $model): bool
    {
        // Check for common ownership patterns
        if (isset($model->user_id) && property_exists($user, 'id')) {
            return $model->user_id === $user->id;
        }

        return false;
    }

    /**
     * Get the resource name for permission checking.
     *
     * Should return the kebab-case plural form of the resource (e.g., 'video-comments', 'exam-attempts').
     */
    abstract protected function getResourceName(): string;

    /**
     * Allow admins and academy users to do anything before other checks.
     *
     * This method is called before other policy methods, allowing super-admins
     * to bypass all authorization checks.
     *
     * @param  mixed  $user  The authenticated user
     * @param  string  $ability  The ability being checked
     * @return bool|null  Return true to allow, false to deny, null to defer to the policy method
     */
    public function before($user, string $ability): ?bool
    {
        // Check if user has admin role
        if (method_exists($user, 'hasRole')) {
            if ($user->hasRole('admin') || $user->hasRole('super-admin')) {
                return true;
            }

            // Academy users get full access to their resources
            if ($user->hasRole('academy') && $this->isAcademyResource()) {
                return true;
            }
        }

        // Check if user is an Admin model (from App\Domains\Auth\Models\Admin)
        $userClass = get_class($user);
        if ($userClass === 'App\\Domains\\Auth\\Models\\Admin') {
            return true;
        }

        return null;
    }

    /**
     * Determine if this resource should be accessible by academy role.
     *
     * Override in child classes to control academy access.
     */
    protected function isAcademyResource(): bool
    {
        return true;
    }

    /**
     * Resolve the effective teacher from the user.
     *
     * For Secretary users, this returns their associated teacher.
     * For Teacher users, this returns themselves.
     *
     * @param  mixed  $user  The authenticated user
     * @return mixed  The teacher model or null
     */
    protected function resolveTeacher($user): mixed
    {
        $userClass = get_class($user);

        // If user is a Teacher, return themselves
        if ($userClass === 'App\\Domains\\Auth\\Models\\Teacher') {
            return $user;
        }

        // If user is a Secretary, return their associated teacher
        if ($userClass === 'App\\Domains\\Auth\\Models\\Secretary') {
            if (method_exists($user, 'teachers')) {
                return $user->teachers()->first();
            }
        }

        return null;
    }

    /**
     * Check if the user is an Academy type.
     *
     * @param  mixed  $user  The authenticated user
     */
    protected function isAcademy($user): bool
    {
        return get_class($user) === 'App\\Domains\\Auth\\Models\\Academy';
    }

    /**
     * Check if the user is a Teacher type.
     *
     * @param  mixed  $user  The authenticated user
     */
    protected function isTeacher($user): bool
    {
        return get_class($user) === 'App\\Domains\\Auth\\Models\\Teacher';
    }

    /**
     * Check if the user is a Secretary type.
     *
     * @param  mixed  $user  The authenticated user
     */
    protected function isSecretary($user): bool
    {
        return get_class($user) === 'App\\Domains\\Auth\\Models\\Secretary';
    }

    /**
     * Check if the user is a Student type.
     *
     * @param  mixed  $user  The authenticated user
     */
    protected function isStudent($user): bool
    {
        return get_class($user) === 'App\\Domains\\Auth\\Models\\Student';
    }

    /**
     * Check if the user is a Guardian type.
     *
     * @param  mixed  $user  The authenticated user
     */
    protected function isGuardian($user): bool
    {
        return get_class($user) === 'App\\Domains\\Auth\\Models\\Guardian';
    }
}
