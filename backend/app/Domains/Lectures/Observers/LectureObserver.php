<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Observers;

use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Jobs\ProcessLectureStart;
use App\Domains\Application\Services\CacheService;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class LectureObserver
{
    /**
     * Handle the Lecture "created" event.
     */
    public function created(Lecture $lecture): void
    {
        CacheService::forgetLecture($lecture->id, $lecture->teacher_id);
        $this->syncLecture($lecture);
    }

    /**
     * Handle the Lecture "updated" event.
     */
    public function updated(Lecture $lecture): void
    {
        CacheService::forgetLecture($lecture->id, $lecture->teacher_id);

        if ($lecture->wasChanged(['is_recurring', 'recurrence_days', 'recurrence_time', 'duration_minutes', 'start_time', 'end_time'])) {
            $this->syncLecture($lecture);
        }
    }

    /**
     * Handle the Lecture "deleted" event.
     */
    public function deleted(Lecture $lecture): void
    {
        CacheService::forgetLecture($lecture->id, $lecture->teacher_id);
        // Note: Delayed jobs will still run but handle() should check if lecture exists
    }

    /**
     * Synchronize the lecture's activation schedule.
     */
    public function syncLecture(Lecture $lecture): void
    {
        $now = now();

        if ($lecture->is_recurring) {
            $this->handleRecurringSync($lecture, $now);
        } else {
            $this->handleOneTimeSync($lecture, $now);
        }
    }

    /**
     * Handle synchronization for one-time lectures.
     */
    private function handleOneTimeSync(Lecture $lecture, Carbon $now): void
    {
        if (!$lecture->start_time || !$lecture->end_time) {
            return;
        }

        if ($now->between($lecture->start_time, $lecture->end_time)) {
            // Lecture SHOULD be active right now
            if (!$lecture->is_active) {
                Log::info("LectureObserver: Immediate activation for one-time lecture {$lecture->id}");
                ProcessLectureStart::dispatch($lecture);
            }
        } elseif ($lecture->start_time->isFuture()) {
            // Future activation
            $delay = max(0, $now->diffInSeconds($lecture->start_time, false));
            ProcessLectureStart::dispatch($lecture)->delay($delay);
            Log::info("LectureObserver: Scheduled activation for one-time lecture {$lecture->id} in {$delay}s");
        }
    }

    /**
     * Handle synchronization for recurring lectures.
     */
    private function handleRecurringSync(Lecture $lecture, Carbon $now): void
    {
        if (!$lecture->recurrence_days || !$lecture->recurrence_time || !$lecture->duration_minutes) {
            Log::warning("LectureObserver: Cannot sync recurring lecture {$lecture->id} - missing configuration");
            return;
        }

        // 1. Check if it should be active RIGHT NOW (Cairo Time)
        $cairoNow = $now->copy()->setTimezone('Africa/Cairo');
        $dayName = $cairoNow->format('l');

        if (in_array($dayName, $lecture->recurrence_days)) {
            $startTime = Carbon::parse($cairoNow->format('Y-m-d') . ' ' . $lecture->recurrence_time, 'Africa/Cairo');
            $endTime = $startTime->copy()->addMinutes((int)$lecture->duration_minutes);

            if ($cairoNow->between($startTime, $endTime)) {
                if (!$lecture->is_active) {
                    Log::info("LectureObserver: Immediate activation for recurring lecture {$lecture->id} (Friday Window)");
                    ProcessLectureStart::dispatch($lecture);
                    return; // Start job will handle scheduling the end
                }
            }
        }

        // 2. Otherwise, schedule next occurrence
        $nextOccurrence = $this->findNextOccurrence($lecture, $now);

        if ($nextOccurrence) {
            $delay = max(0, $now->diffInSeconds($nextOccurrence, false));
            ProcessLectureStart::dispatch($lecture)->delay($delay);
            Log::info("LectureObserver: Scheduled next recurring session for {$lecture->id} in {$delay}s at {$nextOccurrence}");
        }
    }

    /**
     * Find the next occurrence time for a recurring lecture.
     */
    private function findNextOccurrence(Lecture $lecture, Carbon $from): ?Carbon
    {
        $cairoFrom = $from->copy()->setTimezone('Africa/Cairo');
        
        // Start from today and look forward 7 days
        for ($i = 0; $i <= 7; $i++) {
            $day = $cairoFrom->copy()->addDays($i);
            $dayName = $day->format('l');

            if (in_array($dayName, $lecture->recurrence_days)) {
                $occurrence = Carbon::parse($day->format('Y-m-d') . ' ' . $lecture->recurrence_time, 'Africa/Cairo');
                
                // If this occurrence is in the future, return it
                if ($occurrence->greaterThan($cairoFrom)) {
                    return $occurrence->setTimezone('UTC');
                }
            }
        }

        return null;
    }
}
