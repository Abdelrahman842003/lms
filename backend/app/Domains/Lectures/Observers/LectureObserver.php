<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Observers;

use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Jobs\ProcessLectureStart;
use App\Domains\Application\Services\CacheService;
use Illuminate\Support\Facades\Log;

class LectureObserver
{
    /**
     * Handle the Lecture "created" event.
     */
    public function created(Lecture $lecture): void
    {
        CacheService::forgetLecture($lecture->id, $lecture->teacher_id);
        
        if ($lecture->is_recurring) {
            // Schedule recurring lecture
            $this->scheduleRecurringLecture($lecture);
        } elseif ($lecture->start_time) {
            // Schedule activation for one-time lectures
            if ($lecture->start_time->isFuture()) {
                $delay = max(0, now()->diffInSeconds($lecture->start_time, false));
                ProcessLectureStart::dispatch($lecture)->delay($delay);
                Log::info("LectureObserver: Scheduled activation for {$lecture->id} in {$delay}s at {$lecture->start_time}");
            } elseif ($lecture->end_time->isFuture()) {
                // If start time is past but end time is future (should be active NOW), dispatch immediately
                ProcessLectureStart::dispatch($lecture);
                Log::info("LectureObserver: Immediate activation for {$lecture->id}");
            }
        }
    }

    /**
     * Handle the Lecture "updated" event.
     */
    public function updated(Lecture $lecture): void
    {
        CacheService::forgetLecture($lecture->id, $lecture->teacher_id);

        if ($lecture->is_recurring) {
            // Reschedule if recurring configuration changed
            if ($lecture->wasChanged(['recurrence_days', 'recurrence_time', 'duration_minutes'])) {
                $this->scheduleRecurringLecture($lecture);
            }
        } elseif ($lecture->wasChanged('start_time') && $lecture->start_time) {
            // Reschedule activation if start_time changed for one-time lectures
            if ($lecture->start_time->isFuture()) {
                $delay = max(0, now()->diffInSeconds($lecture->start_time, false));
                ProcessLectureStart::dispatch($lecture)->delay($delay);
                Log::info("LectureObserver: Rescheduled activation for {$lecture->id} in {$delay}s at {$lecture->start_time}");
            } elseif ($lecture->end_time->isFuture()) {
                 // If rescheduled to NOW/Past, dispatch immediately
                ProcessLectureStart::dispatch($lecture);
                Log::info("LectureObserver: Immediate activation (rescheduled) for {$lecture->id}");
            }
        }
    }

    /**
     * Handle the Lecture "deleted" event.
     */
    public function deleted(Lecture $lecture): void
    {
        CacheService::forgetLecture($lecture->id, $lecture->teacher_id);
    }

    /**
     * Schedule the next occurrence of a recurring lecture.
     */
    private function scheduleRecurringLecture(Lecture $lecture): void
    {
        if (!$lecture->recurrence_days || !$lecture->recurrence_time || !$lecture->duration_minutes) {
            Log::warning("LectureObserver: Cannot schedule recurring lecture {$lecture->id} - missing configuration");
            return;
        }

        $now = now();
        $nextOccurrence = $this->findNextOccurrence($lecture, $now);

        if ($nextOccurrence) {
            $delay = max(0, now()->diffInSeconds($nextOccurrence, false));
            ProcessLectureStart::dispatch($lecture)->delay($delay);
            Log::info("LectureObserver: Scheduled recurring lecture {$lecture->id} in {$delay}s at {$nextOccurrence}");
        } else {
            Log::warning("LectureObserver: No next occurrence found for recurring lecture {$lecture->id}");
        }
    }

    /**
     * Find the next occurrence time for a recurring lecture.
     */
    private function findNextOccurrence(Lecture $lecture, \Carbon\Carbon $from): ?\Carbon\Carbon
    {
        // Check today first
        $today = $from->copy()->setTimezone('Africa/Cairo');
        if (in_array($today->format('l'), $lecture->recurrence_days)) {
            $occurrence = $today->copy()->setTimeFromTimeString($lecture->recurrence_time);
            if ($occurrence->greaterThan($from)) {
                return $occurrence;
            }
        }

        // Check the next 7 days
        for ($i = 1; $i <= 7; $i++) {
            $day = $today->copy()->addDays($i);
            if (in_array($day->format('l'), $lecture->recurrence_days)) {
                return $day->setTimeFromTimeString($lecture->recurrence_time);
            }
        }

        return null;
    }
}
