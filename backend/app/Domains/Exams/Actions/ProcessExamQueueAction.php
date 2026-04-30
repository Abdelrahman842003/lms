<?php

declare(strict_types=1);

namespace App\Domains\Exams\Actions;

use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Services\ExamQueueService;
use App\Domains\Exams\Actions\StartAttemptAction;
use App\Domains\Application\Services\Student\StudentExamService;
use App\Domains\Exams\Events\ExamAttemptReady;
use Illuminate\Support\Facades\Log;

class ProcessExamQueueAction
{
    public function __construct(
        private ExamQueueService $queueService,
        private StartAttemptAction $startAttemptAction,
        private StudentExamService $studentExamService
    ) {}

    public function execute(int $batchSize = 50): void
    {
        $examIds = $this->queueService->getActiveQueues();

        if (empty($examIds)) {
            return;
        }

        foreach ($examIds as $examId) {
            $this->processExamQueue($examId, $batchSize);
        }
    }

    private function processExamQueue(string $examId, int $batchSize): void
    {
        $exam = Exam::find($examId);
        if (!$exam || !$exam->is_active) {
            return;
        }

        $studentIds = $this->queueService->fetchNextBatch($examId, $batchSize);

        foreach ($studentIds as $studentId) {
            try {
                // Use StartAttemptAction to bypass the queue-entry logic in StudentExamService
                $attempt = $this->startAttemptAction->execute($exam, (string) $studentId);
                
                // Get the standard response data format
                $attemptData = $this->studentExamService->getAttemptData($attempt);
                
                // Notify the student
                ExamAttemptReady::dispatch((string) $studentId, $attemptData);
                
                Log::info("Exam entry queue: Student {$studentId} admitted to exam {$examId}");
            } catch (\Exception $e) {
                Log::error("Failed to process queue for student {$studentId} in exam {$examId}: " . $e->getMessage());
            }
        }
    }
}
