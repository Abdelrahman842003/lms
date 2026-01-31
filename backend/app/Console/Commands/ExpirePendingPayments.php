<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\PaymentLog;
use Illuminate\Console\Command;

class ExpirePendingPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark expired pending payments as expired';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = PaymentLog::where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired']);

        $this->info("Expired {$count} pending payment(s).");

        return Command::SUCCESS;
    }
}
