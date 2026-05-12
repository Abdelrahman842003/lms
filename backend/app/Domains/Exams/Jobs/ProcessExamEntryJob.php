<?php

declare(strict_types=1);

namespace App\Domains\Exams\Jobs;

use App\Domains\Exams\Actions\StartAttemptAction;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Events\ExamAttemptReady;
use App\Domains\Application\Services\Student\StudentExamService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class ProcessExamEntryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private string $examId,
        private string $studentId
    ) {
        $this->onQueue('waiting-room');
    }

    /**
     * Execute the job.
     */
    public function handle(
        StartAttemptAction $startAttemptAction,
        StudentExamService $studentExamService
    ): void {
        // Redis Throttling to prevent DB overload and race conditions
        // Allow 50 students per second per exam
        Redis::throttle("exam-entry:{$this->examId}")
            ->allow(50)
            ->every(1)
            ->block(10)
            ->then(function () use ($startAttemptAction, $studentExamService) {
                $exam = Exam::find($this->examId);
                
                if (!$exam || !$exam->is_active) {
                    return;
                }

                try {
                    $attempt = $startAttemptAction->execute($exam, $this->studentId);
                    $attemptData = $studentExamService->getAttemptData($attempt);
                    
                    // Broadcast to student via Reverb
                    ExamAttemptReady::dispatch($this->studentId, $attemptData);
                    
                    Log::info("Exam entry: Student {$this->studentId} admitted to exam {$this->examId}");
                } catch (\Exception $e) {
                    Log::error("Failed to process exam entry for student {$this->studentId}: " . $e->getMessage());
                }
            }, function () {
                // Could not obtain lock... job will be released back to queue
                $this->release(2);
            });
    }
}
