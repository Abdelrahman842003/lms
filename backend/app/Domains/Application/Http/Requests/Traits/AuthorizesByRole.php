<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Traits;

use Illuminate\Auth\Access\AuthorizationException;

/**
 * Trait for role-based authorization in Form Requests.
 *
 * This trait provides methods for checking user roles and resource ownership,
 * useful for authorization scenarios that don't fit standard policy patterns.
 *
 * @see https://laravel.com/docs/12.x/authorization
 */
trait AuthorizesByRole
{
    /**
     * Check if the authenticated user has any of the specified roles.
     *
     * @param array<string> $roles
     * @return bool
     */
    protected function hasAnyRole(array $roles): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        // Check for 'role' property (common pattern)
        if (isset($user->role) && in_array($user->role, $roles, true)) {
            return true;
        }

        // Check for 'user_type' property (alternative pattern)
        if (isset($user->user_type) && in_array($user->user_type, $roles, true)) {
            return true;
        }

        // Check using Spatie Permission package if available
        if (method_exists($user, 'hasAnyRole')) {
            return $user->hasAnyRole($roles);
        }

        return false;
    }

    /**
     * Check if the authenticated user has all of the specified roles.
     *
     * @param array<string> $roles
     * @return bool
     */
    protected function hasAllRoles(array $roles): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        // Check using Spatie Permission package if available
        if (method_exists($user, 'hasAllRoles')) {
            return $user->hasAllRoles($roles);
        }

        // Fallback to manual checking
        foreach ($roles as $role) {
            if (!$this->hasAnyRole([$role])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if user owns the resource (IDOR protection).
     *
     * This method verifies that the authenticated user is the owner
     * of the resource being accessed, preventing Insecure Direct
     * Object Reference (IDOR) vulnerabilities.
     *
     * @param string $resourceClass The model class of the resource
     * @param string $ownerField The field name that stores the owner ID
     * @return bool
     */
    protected function ownsResource(string $resourceClass, string $ownerField = 'user_id'): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        $id = $this->route('id') ?? $this->route('model');

        if (!$id) {
            return false;
        }

        /** @var \Illuminate\Database\Eloquent\Model|null $resource */
        $resource = $resourceClass::find($id);

        if (!$resource) {
            return false;
        }

        return $resource->{$ownerField} === $user->id;
    }

    /**
     * Check if user owns the resource via teacher relationship.
     *
     * Specific to this application's domain where resources may be
     * owned by teachers but accessed by secretaries.
     *
     * @param string $resourceClass The model class of the resource
     * @return bool
     */
    protected function ownsViaTeacher(string $resourceClass): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        $id = $this->route('id') ?? $this->route('model');

        if (!$id) {
            return false;
        }

        /** @var \Illuminate\Database\Eloquent\Model|null $resource */
        $resource = $resourceClass::find($id);

        if (!$resource) {
            return false;
        }

        // Check direct teacher ownership
        if (isset($resource->teacher_profile_id) && $resource->teacher_profile_id === $user->id) {
            return true;
        }

        // Check via secretary relationship
        if (method_exists($user, 'teachers') && isset($resource->teacher_profile_id)) {
            return $user->teachers()->where('teachers.id', $resource->teacher_profile_id)->exists();
        }

        return false;
    }

    /**
     * Check if user belongs to the same academy as the resource.
     *
     * @param string $resourceClass The model class of the resource
     * @return bool
     */
    protected function belongsToSameAcademy(string $resourceClass): bool
    {
        $user = auth()->user();

        if (!$user || !isset($user->academy_id)) {
            return false;
        }

        $id = $this->route('id') ?? $this->route('model');

        if (!$id) {
            return false;
        }

        /** @var \Illuminate\Database\Eloquent\Model|null $resource */
        $resource = $resourceClass::find($id);

        if (!$resource || !isset($resource->academy_id)) {
            return false;
        }

        return $resource->academy_id === $user->academy_id;
    }

    /**
     * Authorize that the user is authenticated.
     *
     * @return bool
     */
    protected function isAuthenticated(): bool
    {
        return auth()->check();
    }

    /**
     * Authorize that the user is a guest (not authenticated).
     *
     * @return bool
     */
    protected function isGuest(): bool
    {
        return !auth()->check();
    }

    /**
     * Require specific role or throw exception.
     *
     * @param array<string> $roles
     * @throws AuthorizationException
     */
    protected function requireAnyRole(array $roles): void
    {
        if (!$this->hasAnyRole($roles)) {
            throw new AuthorizationException(
                'You do not have the required role to perform this action.'
            );
        }
    }

    /**
     * Require resource ownership or throw exception.
     *
     * @param string $resourceClass
     * @param string $ownerField
     * @throws AuthorizationException
     */
    protected function requireOwnership(string $resourceClass, string $ownerField = 'user_id'): void
    {
        if (!$this->ownsResource($resourceClass, $ownerField)) {
            throw new AuthorizationException(
                'You do not own this resource.'
            );
        }
    }
}
