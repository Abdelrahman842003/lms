<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Events;

use App\Domains\Subscriptions\Models\PaymentTransaction;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentRejected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly PaymentTransaction $transaction
    ) {}
}
