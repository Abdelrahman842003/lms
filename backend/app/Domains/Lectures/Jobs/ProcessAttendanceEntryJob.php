<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Jobs;

use App\Domains\Lectures\Models\Lecture;
use App\Domains\Auth\Models\Student;
use App\Domains\Application\Services\Student\StudentAttendanceService;
use App\Domains\Lectures\Events\AttendanceProcessed;
use App\Domains\Lectures\Events\LectureQueueProgress;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class ProcessAttendanceEntryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private string $lectureId,
        private string $studentId,
        private int $position
    ) {
        $this->onQueue('waiting-room');
    }

    /**
     * Execute the job.
     */
    public function handle(StudentAttendanceService $attendanceService): void
    {
        // Redis Throttling to prevent DB overload
        // Allow 20 students per second for a smoother flow
        Redis::throttle("attendance-entry:{$this->lectureId}")
            ->allow(20)
            ->every(1)
            ->then(function () use ($attendanceService) {
                $lecture = Lecture::find($this->lectureId);
                $student = Student::find($this->studentId);

                if (!$lecture || !$student) {
                    return;
                }

                try {
                    $result = $attendanceService->processQueuedAttendance($student, $lecture);
                    
                    // Broadcast to student via Reverb (Admission)
                    AttendanceProcessed::dispatch($this->studentId, $result);
                    
                    // Update global progress for this lecture waiting room
                    Redis::set("waiting-room:lecture:{$this->lectureId}:processed", $this->position);
                    LectureQueueProgress::dispatch($this->lectureId, $this->position);
                    
                    Log::info("Attendance entry: Student {$this->studentId} marked present for lecture {$this->lectureId} (Pos: {$this->position})");
                } catch (\Exception $e) {
                    Log::error("Failed to process attendance entry for student {$this->studentId}: " . $e->getMessage());
                }
            }, function () {
                // Could not obtain lock... job will be released back to queue
                $this->release(1);
            });
    }
}
