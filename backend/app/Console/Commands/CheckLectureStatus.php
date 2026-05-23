<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Events\LectureUpdated;
use App\Domains\Lectures\Events\LectureActivated;
use App\Domains\Lectures\Events\LectureClosed;
use App\Domains\Lectures\Notifications\LectureStatusNotification;
use App\Domains\Lectures\Jobs\ProcessLectureEnd;
use App\Domains\Lectures\Jobs\ProcessLectureStart;
use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CheckLectureStatus extends Command
{
    protected $signature = 'lectures:check-status';
    protected $description = 'Check and update lecture status based on schedule';

    public function handle()
    {
        $now = Carbon::now();
        $this->info("Checking lecture status at {$now}");

        // 1. Handle One-time Lectures
        $oneTimeLectures = Lecture::where('is_recurring', false)
            ->whereNotNull('start_time')
            ->whereNotNull('end_time')
            ->get();

        foreach ($oneTimeLectures as $lecture) {
            // Activation
            if (!$lecture->is_active && $now->between($lecture->start_time, $lecture->end_time)) {
                $lecture->update(['is_active' => true]);
                $this->info("Activated lecture: {$lecture->title} ({$lecture->id})");
                Log::info("Auto-activated lecture: {$lecture->title} ({$lecture->id})");
                
                // Dispatch realtime events
                LectureUpdated::dispatch($lecture, 'started');
                event(new LectureActivated($lecture));
                
                // Notify teacher and academy immediately
                $lecture->teacher->notify(new LectureStatusNotification($lecture, 'active'));
                if ($lecture->academy) {
                    $lecture->academy->notify(new LectureStatusNotification($lecture, 'active'));
                }
                
                // Schedule end job
                $delay = $now->diffInSeconds($lecture->end_time);
                ProcessLectureEnd::dispatch($lecture)->delay($delay);
            }
            // Deactivation
            elseif ($lecture->is_active && $now->gt($lecture->end_time)) {
                $lecture->update(['is_active' => false]);
                $this->info("Deactivated lecture: {$lecture->title} ({$lecture->id})");
                Log::info("Auto-deactivated lecture: {$lecture->title} ({$lecture->id})");
                
                // Dispatch realtime events
                LectureUpdated::dispatch($lecture, 'ended');
                event(new LectureClosed($lecture));
                
                // Notify teacher and academy immediately
                $lecture->teacher->notify(new LectureStatusNotification($lecture, 'finished'));
                if ($lecture->academy) {
                    $lecture->academy->notify(new LectureStatusNotification($lecture, 'finished'));
                }

                // Dispatch job for end lecture processing (absent marking etc)
                ProcessLectureEnd::dispatch($lecture);
            }
            // Look-ahead Activation (One-time)
            elseif (!$lecture->is_active && $lecture->start_time->between($now, $now->copy()->addMinute())) {
                $delay = $now->diffInSeconds($lecture->start_time);
                ProcessLectureStart::dispatch($lecture)->delay($delay);
                $this->info("Scheduled activation for lecture: {$lecture->title} in {$delay} seconds");
            }
        }

        // 2. Handle Recurring Lectures
        $recurringLectures = Lecture::where('is_recurring', true)->get();

        foreach ($recurringLectures as $lecture) {
            if (!$lecture->recurrence_time || !$lecture->duration_minutes) {
                continue;
            }

            $shouldBeActive = false;
            // Check today and yesterday to handle overnight sessions or late closures
            $datesToCheck = [$now->copy(), $now->copy()->subDay()];

            foreach ($datesToCheck as $date) {
                $dayName = $date->format('l');
                if (in_array($dayName, $lecture->recurrence_days ?? [])) {
                    // Parse recurrence time for this specific date in Cairo timezone
                    $startTime = Carbon::parse($date->setTimezone('Africa/Cairo')->format('Y-m-d') . ' ' . $lecture->recurrence_time, 'Africa/Cairo')
                        ->setTimezone('UTC');
                    $endTime = $startTime->copy()->addMinutes($lecture->duration_minutes);

                    // Check if NOW is within this occurrence's window
                    if ($now->between($startTime, $endTime)) {
                        $shouldBeActive = true;
                        break;
                    }
                }
            }

            // State Transitions
            if ($shouldBeActive && !$lecture->is_active) {
                $lecture->update(['is_active' => true]);
                $this->info("Activated recurring lecture: {$lecture->title} ({$lecture->id})");
                Log::info("Auto-activated recurring lecture: {$lecture->title} ({$lecture->id})");
                
                // Dispatch realtime events
                LectureUpdated::dispatch($lecture, 'started');
                event(new LectureActivated($lecture));

                // Notify teacher and academy immediately
                $lecture->teacher->notify(new LectureStatusNotification($lecture, 'active'));
                if ($lecture->academy) {
                    $lecture->academy->notify(new LectureStatusNotification($lecture, 'active'));
                }

                // Schedule end job
                $delay = $now->diffInSeconds($endTime);
                ProcessLectureEnd::dispatch($lecture)->delay($delay);
            } elseif (!$shouldBeActive && $lecture->is_active) {
                $lecture->update(['is_active' => false]);
                $this->info("Deactivated recurring lecture: {$lecture->title} ({$lecture->id})");
                Log::info("Auto-deactivated recurring lecture: {$lecture->title} ({$lecture->id})");
                
                // Dispatch realtime events
                LectureUpdated::dispatch($lecture, 'ended');
                event(new LectureClosed($lecture));
                
                // Notify teacher and academy immediately
                $lecture->teacher->notify(new LectureStatusNotification($lecture, 'finished'));
                if ($lecture->academy) {
                    $lecture->academy->notify(new LectureStatusNotification($lecture, 'finished'));
                }
                
                ProcessLectureEnd::dispatch($lecture);
            }
            
            // Look-ahead Activation (Recurring)
            if (!$lecture->is_active) {
                if (in_array($now->format('l'), $lecture->recurrence_days ?? [])) {
                    $startTime = Carbon::parse($now->setTimezone('Africa/Cairo')->format('Y-m-d') . ' ' . $lecture->recurrence_time, 'Africa/Cairo')->setTimezone('UTC');
                    
                    if ($startTime->between($now, $now->copy()->addMinute())) {
                        $delay = $now->diffInSeconds($startTime);
                        ProcessLectureStart::dispatch($lecture)->delay($delay);
                        $this->info("Scheduled activation for recurring lecture: {$lecture->title} in {$delay} seconds");
                    }
                }
            }
        }
    }
}
