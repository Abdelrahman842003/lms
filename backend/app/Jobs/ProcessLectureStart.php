<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Lecture;
use App\Events\LectureUpdated;
use App\Notifications\LectureStatusNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessLectureStart implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Lecture $lecture
    ) {}

    public function handle(): void
    {
        $this->lecture->refresh();

        // Safety check: If one-time lecture and start time is in the future (e.g. rescheduled), don't activate yet.
        if (!$this->lecture->is_recurring && $this->lecture->start_time && $this->lecture->start_time->isFuture()) {
             // If it's more than 1 minute in the future, reschedule or ignore (assuming a new job was dispatched on update)
             if ($this->lecture->start_time->diffInMinutes(now()) > 1) {
                 Log::info("ProcessLectureStart: Skipped premature activation for {$this->lecture->id}. Start time is future.");
                 return;
             }
        }

        if (!$this->lecture->is_active) {
            $this->lecture->update(['is_active' => true]);
            
            // Refresh model to get updated data
            $this->lecture->refresh();
            
            Log::info("ProcessLectureStart: Activated lecture {$this->lecture->id}");
            
            // Dispatch event (WebSocket update) with fresh data
            LectureUpdated::dispatch($this->lecture);
            
            // Notify teacher immediately
            $this->lecture->teacher->notify(new LectureStatusNotification($this->lecture, 'active'));
            
            // Schedule end job
            // We need to calculate end time based on current time + duration? 
            // Or just use the lecture's end time?
            // For recurring lectures, the end time is dynamic.
            // But this job is dispatched with a specific context.
            // However, the lecture model instance here might not have the dynamic end time.
            // We should probably rely on the CheckLectureStatus logic to schedule the end job?
            // OR, we can calculate it here.
            
            // Actually, CheckLectureStatus schedules ProcessLectureEnd when it activates.
            // If we activate here, we must also schedule ProcessLectureEnd here.
            
            $now = now();
            $endTime = null;
            
            // Calculate end time based on lecture type
            if (!$this->lecture->is_recurring) {
                // One-time lecture: use the stored end_time
                $endTime = $this->lecture->end_time;
            } else {
                // Recurring lecture: calculate end time from current activation + duration
                $endTime = $now->copy()->addMinutes($this->lecture->duration_minutes);
            }
            
            if ($endTime) {
                $delay = max(0, now()->diffInSeconds($endTime, false));
                ProcessLectureEnd::dispatch($this->lecture)->delay($delay);
                Log::info("ProcessLectureStart: Scheduled end for {$this->lecture->id} in {$delay}s at {$endTime}");
            }
        }
    }
}
