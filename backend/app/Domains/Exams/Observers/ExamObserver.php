<?php

declare(strict_types=1);

namespace App\Domains\Exams\Observers;

use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Jobs\ProcessExamStart;
use App\Domains\Application\Services\CacheService;
use Illuminate\Support\Facades\Log;

class ExamObserver
{
    /**
     * Handle the Exam "created" event.
     */
    public function created(Exam $exam): void
    {
        $teacherId = null;
        if ($exam->teacher_profile_id) {
            $profile = \App\Domains\Auth\Models\TeacherProfile::find($exam->teacher_profile_id);
            if ($profile) {
                $teacherId = $profile->teacher_id;
            }
        }
        if ($teacherId) {
            CacheService::forgetExam($exam->id, $teacherId);
        }
        $this->scheduleExamActivation($exam);
    }

    /**
     * Handle the Exam "updated" event.
     */
    public function updated(Exam $exam): void
    {
        $teacherId = null;
        if ($exam->teacher_profile_id) {
            $profile = \App\Domains\Auth\Models\TeacherProfile::find($exam->teacher_profile_id);
            if ($profile) {
                $teacherId = $profile->teacher_id;
            }
        }
        if ($teacherId) {
            CacheService::forgetExam($exam->id, $teacherId);
        }
        
        // Reschedule if date or duration changed
        if ($exam->wasChanged(['date', 'duration'])) {
            $this->scheduleExamActivation($exam);
        }
    }

    /**
     * Handle the Exam "deleted" event.
     */
    public function deleted(Exam $exam): void
    {
        $teacherId = null;
        if ($exam->teacher_profile_id) {
            $profile = \App\Domains\Auth\Models\TeacherProfile::find($exam->teacher_profile_id);
            if ($profile) {
                $teacherId = $profile->teacher_id;
            }
        }
        if ($teacherId) {
            CacheService::forgetExam($exam->id, $teacherId);
        }
    }

    /**
     * Schedule the exam to activate at its scheduled date/time.
     */
    private function scheduleExamActivation(Exam $exam): void
    {
        // Only schedule if exam has a date and is not already active or ended
        if (!$exam->date || $exam->is_active || $exam->ended_at) {
            return;
        }

        $now = now();
        $startTime = $exam->date;
        $endTime = $exam->date->copy()->addMinutes($exam->duration ?? 60);

        // If start time is in the future, schedule activation
        if ($startTime->isFuture()) {
            $delay = max(0, $now->diffInSeconds($startTime, false));
            ProcessExamStart::dispatch($exam)->delay($delay);
            Log::info("ExamObserver: Scheduled activation for exam {$exam->id} in {$delay}s at {$startTime}");
        }
        // If start time is past but end time is future (should be active NOW), activate immediately
        elseif ($endTime->isFuture()) {
            ProcessExamStart::dispatch($exam);
            Log::info("ExamObserver: Immediate activation for exam {$exam->id}");
        }
        // If both start and end are in the past, don't schedule
        else {
            Log::info("ExamObserver: Exam {$exam->id} date is in the past, not scheduling.");
        }
    }
}
