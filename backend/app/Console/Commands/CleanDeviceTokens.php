<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DeviceToken;

class CleanDeviceTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tokens:clean';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old device tokens that haven\'t been used in 60 days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = 60;
        $date = now()->subDays($days);
        
        $count = DeviceToken::where('last_used_at', '<', $date)->delete();
        
        $this->info("Deleted {$count} tokens older than {$days} days.");
    }
}
