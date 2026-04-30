<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Actions;

use App\Domains\Lectures\Models\Lecture;
use App\Domains\Auth\Models\Student;
use App\Domains\Lectures\Services\AttendanceQueueService;
use App\Domains\Application\Services\Student\StudentAttendanceService;
use App\Domains\Lectures\Events\AttendanceProcessed;
use Illuminate\Support\Facades\Log;

class ProcessAttendanceQueueAction
{
    public function __construct(
        private AttendanceQueueService $queueService,
        private StudentAttendanceService $attendanceService
    ) {}

    public function execute(int $batchSize = 50): void
    {
        $lectureIds = $this->queueService->getActiveQueues();

        if (empty($lectureIds)) {
            return;
        }

        foreach ($lectureIds as $lectureId) {
            $this->processLectureQueue($lectureId, $batchSize);
        }
    }

    private function processLectureQueue(string $lectureId, int $batchSize): void
    {
        $lecture = Lecture::find($lectureId);
        if (!$lecture) {
            return;
        }

        $studentIds = $this->queueService->fetchNextBatch($lectureId, $batchSize);

        foreach ($studentIds as $studentId) {
            try {
                $student = Student::find($studentId);
                if (!$student) {
                    continue;
                }

                $result = $this->attendanceService->processQueuedAttendance($student, $lecture);
                
                // Notify the student
                AttendanceProcessed::dispatch((string) $studentId, $result);
                
                Log::info("Attendance queue: Student {$studentId} marked present for lecture {$lectureId}");
            } catch (\Exception $e) {
                Log::error("Failed to process attendance queue for student {$studentId} in lecture {$lectureId}: " . $e->getMessage());
            }
        }
    }
}
