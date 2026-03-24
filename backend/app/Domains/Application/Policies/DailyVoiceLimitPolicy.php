<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Application\Models\DailyVoiceLimit;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for DailyVoiceLimit model.
 *
 * Handles authorization for daily voice limit operations.
 */
class DailyVoiceLimitPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'daily-voice-limits';
    }

    protected function isAcademyResource(): bool
    {
        return false; // Only admins can manage voice limits
    }

    public function viewAny($user): bool
    {
        // Only admins can view voice limits
        return $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        // Only admins can view voice limits
        return $user instanceof Admin;
    }

    public function create($user): bool
    {
        // Voice limits are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Only admins can update voice limits
        return $user instanceof Admin;
    }

    public function delete($user, Model $model): bool
    {
        // Voice limits should not be deleted
        return $user instanceof Admin;
    }
}
