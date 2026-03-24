<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Gamification\Models\GamificationSetting;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for GamificationSetting model.
 *
 * Handles authorization for gamification settings operations.
 */
class GamificationSettingPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'gamification-settings';
    }

    protected function isAcademyResource(): bool
    {
        return false; // Only admins manage gamification settings
    }

    public function viewAny($user): bool
    {
        // Only admins can view gamification settings
        return $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        // Only admins can view gamification settings
        return $user instanceof Admin;
    }

    public function create($user): bool
    {
        // Only admins can create gamification settings
        return $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        // Only admins can update gamification settings
        return $user instanceof Admin;
    }

    public function delete($user, Model $model): bool
    {
        // Only admins can delete gamification settings
        return $user instanceof Admin;
    }
}
