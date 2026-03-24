<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\LoginAttempt;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for LoginAttempt model.
 *
 * Handles authorization for login attempt operations.
 * Login attempts are read-only audit records.
 */
class LoginAttemptPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'login-attempts';
    }

    protected function isAcademyResource(): bool
    {
        return false; // Only admins can view login attempts
    }

    public function viewAny($user): bool
    {
        // Only admins can view login attempts
        return $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        // Only admins can view login attempts
        return $user instanceof Admin;
    }

    public function create($user): bool
    {
        // Login attempts are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Login attempts are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Login attempts should not be deleted (audit trail)
        return $user instanceof Admin;
    }
}
