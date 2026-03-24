<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Support\Models\Setting;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Setting model.
 *
 * Handles authorization for system settings operations.
 */
class SettingPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'settings';
    }

    protected function isAcademyResource(): bool
    {
        return false; // Only admins can manage settings
    }

    public function viewAny($user): bool
    {
        // Only admins can view settings
        return $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        // Only admins can view settings
        return $user instanceof Admin;
    }

    public function create($user): bool
    {
        // Only admins can create settings
        return $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        // Only admins can update settings
        return $user instanceof Admin;
    }

    public function delete($user, Model $model): bool
    {
        // Only admins can delete settings
        return $user instanceof Admin;
    }
}
