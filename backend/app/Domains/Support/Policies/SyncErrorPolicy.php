<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Support\Models\SyncError;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for SyncError model.
 *
 * Handles authorization for sync error operations.
 * Sync errors are read-only audit records.
 */
class SyncErrorPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'sync-errors';
    }

    protected function isAcademyResource(): bool
    {
        return false; // Only admins can view sync errors
    }

    public function viewAny($user): bool
    {
        // Only admins can view sync errors
        return $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        // Only admins can view sync errors
        return $user instanceof Admin;
    }

    public function create($user): bool
    {
        // Sync errors are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Sync errors are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Only admins can delete sync errors
        return $user instanceof Admin;
    }
}
