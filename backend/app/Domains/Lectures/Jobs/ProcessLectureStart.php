<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Jobs;

use App\Domains\Lectures\Events\LectureUpdated;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Notifications\LectureStatusNotification;
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
        protected Lecture $lecture,
    ) {}

    public function handle(): void
    {
        $this->lecture->refresh();

        if (
            ! $this->lecture->is_recurring
            && $this->lecture->start_time
            && $this->lecture->start_time->isFuture()
            && $this->lecture->start_time->diffInMinutes(now()) > 1
        ) {
            Log::info("ProcessLectureStart: Skipped premature activation for {$this->lecture->id}.");
            return;
        }

        if (! $this->lecture->is_active) {
            $this->lecture->update(['is_active' => true]);
            $this->lecture->refresh();

            Log::info("ProcessLectureStart: Activated lecture {$this->lecture->id}");

            LectureUpdated::dispatch($this->lecture);

            $this->lecture->teacher->notify(new LectureStatusNotification($this->lecture, 'active'));

            $endTime = $this->lecture->is_recurring
                ? now()->copy()->addMinutes($this->lecture->duration_minutes)
                : $this->lecture->end_time;

            if ($endTime) {
                $delay = max(0, now()->diffInSeconds($endTime, false));
                ProcessLectureEnd::dispatch($this->lecture)->delay($delay);
                Log::info("ProcessLectureStart: Scheduled end for {$this->lecture->id} in {$delay}s at {$endTime}");
            }
        }
    }
}
