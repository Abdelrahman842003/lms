<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Subscriptions\Models\PlatformPayment;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for PlatformPayment model.
 *
 * Handles authorization for platform payment operations.
 */
class PlatformPaymentPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'platform-payments';
    }

    protected function isAcademyResource(): bool
    {
        return false; // Only admins can manage platform payments
    }

    public function viewAny($user): bool
    {
        // Only admins can view platform payments
        return $user instanceof Admin;
    }

    public function view($user, Model $model): bool
    {
        // Only admins can view platform payments
        return $user instanceof Admin;
    }

    public function create($user): bool
    {
        // Only admins can create platform payments
        return $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        // Only admins can update platform payments
        return $user instanceof Admin;
    }

    public function delete($user, Model $model): bool
    {
        // Platform payments should not be deleted (audit trail)
        return false;
    }
}
