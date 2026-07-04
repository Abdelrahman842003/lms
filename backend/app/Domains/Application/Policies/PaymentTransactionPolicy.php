<?php

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Subscriptions\Models\PaymentTransaction;
use Illuminate\Auth\Access\HandlesAuthorization;

class PaymentTransactionPolicy
{
    use HandlesAuthorization;

    public function viewAny(Admin $admin): bool
    {
        return true;
    }

    public function view(Admin $admin, PaymentTransaction $transaction): bool
    {
        return true;
    }

    public function create(Admin $admin): bool
    {
        return true;
    }

    public function update(Admin $admin, PaymentTransaction $transaction): bool
    {
        return true;
    }

    public function delete(Admin $admin, PaymentTransaction $transaction): bool
    {
        return true;
    }
}
