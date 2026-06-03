<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Jobs;

use App\Domains\Subscriptions\Models\PaymentTransaction;
use App\Domains\Subscriptions\Enums\PaymentTransactionStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ExpirePendingPaymentTransactions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        PaymentTransaction::where('status', PaymentTransactionStatus::PENDING->value)
            ->where('expires_at', '<', now())
            ->update(['status' => PaymentTransactionStatus::EXPIRED->value]);
    }
}
