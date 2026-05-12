<?php

declare(strict_types=1);

namespace App\Domains\Exams\Jobs;

use App\Domains\Exams\Models\Exam;
use App\Domains\Application\Http\Controllers\Teacher\ExamController;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EndExpiredExamsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(ExamController $controller): void
    {
        Log::info('Checking for expired exams (Job)...');

        $count = 0;

        Exam::where('is_active', true)
            ->whereNotNull('activated_at')
            ->chunkById(100, function ($exams) use ($controller, &$count) {
                foreach ($exams as $exam) {
                    // Calculate end time
                    $endTime = $exam->activated_at->addMinutes($exam->duration);

                    if (now()->greaterThan($endTime)) {
                        Log::info("Ending exam: {$exam->title} (ID: {$exam->id})");
                        try {
                            $controller->endExam($exam);
                            $count++;
                        } catch (\Exception $e) {
                            Log::error("Failed to end exam {$exam->id}: " . $e->getMessage());
                        }
                    }
                }
            });

        Log::info("Ended {$count} expired exams.");
    }
}
