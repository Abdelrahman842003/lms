<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\Exams\Actions\ProcessExamQueueAction;
use Illuminate\Console\Command;

class ProcessExamEntryQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exams:process-queue {--batch=50 : Number of students to process per exam per iteration} {--sleep=2 : Seconds to sleep between iterations}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process the exam entry queue from Redis and admit students in batches';

    /**
     * Execute the console command.
     */
    public function handle(ProcessExamQueueAction $action): void
    {
        $this->info('Starting Exam Entry Queue Processor...');
        
        $batchSize = (int) $this->option('batch');
        $sleepTime = (int) $this->option('sleep');

        while (true) {
            try {
                $action->execute($batchSize);
            } catch (\Exception $e) {
                $this->error('Error processing queue: ' . $e->getMessage());
            }

            sleep($sleepTime);
        }
    }
}
