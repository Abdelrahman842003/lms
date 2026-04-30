<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\Lectures\Actions\ProcessAttendanceQueueAction;
use Illuminate\Console\Command;

class ProcessAttendanceEntryQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:process-queue {--batch=50 : Number of students to process per lecture per iteration} {--sleep=2 : Seconds to sleep between iterations}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process the attendance entry queue from Redis and mark students as present in batches';

    /**
     * Execute the console command.
     */
    public function handle(ProcessAttendanceQueueAction $action): void
    {
        $this->info('Starting Attendance Entry Queue Processor...');
        
        $batchSize = (int) $this->option('batch');
        $sleepTime = (int) $this->option('sleep');

        while (true) {
            try {
                $action->execute($batchSize);
            } catch (\Exception $e) {
                $this->error('Error processing attendance queue: ' . $e->getMessage());
            }

            sleep($sleepTime);
        }
    }
}
