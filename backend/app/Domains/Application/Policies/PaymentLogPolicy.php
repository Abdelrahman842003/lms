<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Subscriptions\Models\PaymentLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for PaymentLog model.
 *
 * Handles authorization for payment log operations.
 * Payment logs are read-only audit records.
 */
class PaymentLogPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'payment-logs';
    }

    protected function isAcademyResource(): bool
    {
        return false; // Only admins can view payment logs
    }

    public function viewAny($user): bool
    {
        // Only admins can view payment logs
        return $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        // Only admins can view payment logs
        return $user instanceof Admin;
    }

    public function create($user): bool
    {
        // Payment logs are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Payment logs are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Payment logs should not be deleted (audit trail)
        return false;
    }
}
