<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Notifications\Models\SentNotification;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for SentNotification model.
 *
 * Handles authorization for sent notification operations.
 * Sent notifications are read-only audit records.
 */
class SentNotificationPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'sent-notifications';
    }

    protected function isAcademyResource(): bool
    {
        return false; // Only admins can view sent notifications
    }

    public function viewAny($user): bool
    {
        // Only admins can view sent notifications
        return $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        // Only admins can view sent notifications
        return $user instanceof Admin;
    }

    public function create($user): bool
    {
        // Sent notifications are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Sent notifications are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Sent notifications should not be deleted (audit trail)
        return false;
    }
}
