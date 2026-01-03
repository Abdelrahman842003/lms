<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Lecture;
use App\Events\LectureUpdated;
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
                LectureUpdated::dispatch($lecture); // Dispatch event
            }
            // Deactivation
            elseif ($lecture->is_active && $now->gt($lecture->end_time)) {
                $lecture->update(['is_active' => false]);
                $this->info("Deactivated lecture: {$lecture->title} ({$lecture->id})");
                Log::info("Auto-deactivated lecture: {$lecture->title} ({$lecture->id})");
                LectureUpdated::dispatch($lecture); // Dispatch event
                // Dispatch job for end lecture processing (absent marking etc)
                \App\Jobs\ProcessLectureEnd::dispatch($lecture);
            }
        }

        // 2. Handle Recurring Lectures
        $recurringLectures = Lecture::where('is_recurring', true)->get();
        $currentDayName = $now->format('l'); // e.g., "Saturday"

        foreach ($recurringLectures as $lecture) {
            if (!in_array($currentDayName, $lecture->recurrence_days ?? [])) {
                continue;
            }

            if (!$lecture->recurrence_time || !$lecture->duration_minutes) {
                continue;
            }

            // Parse recurrence time for today in Cairo timezone, then convert to UTC
            $startTime = Carbon::parse($now->setTimezone('Africa/Cairo')->format('Y-m-d') . ' ' . $lecture->recurrence_time, 'Africa/Cairo')
                ->setTimezone('UTC');
            $endTime = $startTime->copy()->addMinutes($lecture->duration_minutes);

            // Check for Activation
            // If current time is within [start, end] and not active
            if ($now->between($startTime, $endTime) && !$lecture->is_active) {
                $lecture->update(['is_active' => true]);
                $this->info("Activated recurring lecture: {$lecture->title} ({$lecture->id})");
                Log::info("Auto-activated recurring lecture: {$lecture->title} ({$lecture->id})");
                LectureUpdated::dispatch($lecture);
            }

            // Check for Deactivation
            // If current time is past end time and is active
            // We need to be careful not to deactivate if it was manually activated for an extra session?
            // But the requirement is auto-close.
            // Also check if it's the same day session.
            if ($now->gt($endTime) && $lecture->is_active) {
                 // Only deactivate if we are sure this activation belongs to today's session?
                 // Or just strictly follow the schedule.
                 $lecture->update(['is_active' => false]);
                 $this->info("Deactivated recurring lecture: {$lecture->title} ({$lecture->id})");
                 Log::info("Auto-deactivated recurring lecture: {$lecture->title} ({$lecture->id})");
                 LectureUpdated::dispatch($lecture);
                 
                 \App\Jobs\ProcessLectureEnd::dispatch($lecture);
            }
        }
    }
}
