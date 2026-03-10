<?php

declare(strict_types=1);

namespace App\Domains\Videos\Jobs;

use App\Domains\Videos\Services\VideoReminderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessDueVideoRemindersJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(VideoReminderService $reminderService): void
    {
        $reminderService->processDueReminders();
    }
}
