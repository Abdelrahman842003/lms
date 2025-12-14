<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanOldNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:clean {--days=30 : The number of days to keep notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete notifications older than a specified number of days (default 30)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');
        $date = now()->subDays($days);

        $this->info("Cleaning notifications older than {$days} days ({$date})...");

        $count = DB::table('notifications')
            ->where('created_at', '<', $date)
            ->delete();

        $this->info("Deleted {$count} old notifications.");
        Log::info("CleanOldNotifications: Deleted {$count} notifications older than {$days} days.");
    }
}
