<?php

declare(strict_types=1);

namespace App\Domains\Exams\Jobs;

use App\Domains\Exams\Actions\StartAttemptAction;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Events\ExamAttemptReady;
use App\Domains\Application\Services\Student\StudentExamService;
use App\Domains\Exams\Events\ExamQueueProgress;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class ProcessExamEntryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private string $examId,
        private string $studentId,
        private int $position
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
        // Throttling to prevent DB overload
        // Allow 20 students per second for a smoother flow
        $executed = RateLimiter::attempt(
            "exam-entry:{$this->examId}",
            20,
            function () use ($startAttemptAction, $studentExamService) {
                $exam = Exam::find($this->examId);
                
                if (!$exam || !$exam->is_active) {
                    return true;
                }

                try {
                    $attempt = $startAttemptAction->execute($exam, $this->studentId);
                    $attemptData = $studentExamService->getAttemptData($attempt);
                    
                    // Broadcast to student via Reverb (Admission)
                    ExamAttemptReady::dispatch($this->studentId, $attemptData);
                    
                    // Update global progress for this exam waiting room
                    Cache::put("waiting-room:exam:{$this->examId}:processed", $this->position);
                    ExamQueueProgress::dispatch($this->examId, $this->position);
                    
                    Log::info("Exam entry: Student {$this->studentId} admitted to exam {$this->examId} (Pos: {$this->position})");
                    return true;
                } catch (\Exception $e) {
                    Log::error("Failed to process exam entry for student {$this->studentId}: " . $e->getMessage());
                    return true; // Still return true so we don't retry if it's a domain error
                }
            },
            1 // decay seconds
        );

        if (! $executed) {
            // Could not obtain lock... job will be released back to queue
            $this->release(1);
        }
    }
}
