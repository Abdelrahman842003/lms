<?php

namespace App\Console\Commands;

use App\Models\Lecture;
use App\Services\Teacher\LectureService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateRecurringLectures extends Command
{
    protected $signature = 'lectures:generate';
    protected $description = 'Generate recurring lecture instances for the next 7 days';

    public function handle(LectureService $lectureService)
    {
        $this->info('Generating recurring lectures...');

        $recurringLectures = Lecture::where('is_recurring', true)->get();

        foreach ($recurringLectures as $template) {
            $this->info("Processing template: {$template->title} (ID: {$template->id})");

            $days = $template->recurrence_days; // e.g., ['Saturday', 'Tuesday']
            $time = $template->recurrence_time; // e.g., '14:00'
            $duration = $template->duration_minutes;

            // Look ahead 7 days
            for ($i = 0; $i < 7; $i++) {
                $date = Carbon::now()->addDays($i);
                $dayName = $date->format('l'); // e.g., 'Saturday'

                if (in_array($dayName, $days)) {
                    // Check if instance already exists for this date
                    $startDateTime = Carbon::parse($date->format('Y-m-d') . ' ' . $time);
                    
                    $exists = Lecture::where('parent_id', $template->id)
                        ->whereDate('start_time', $startDateTime->toDateString())
                        ->exists();

                    if (!$exists) {
                        $this->info("Creating instance for {$dayName} {$startDateTime}");
                        
                        $lectureService->createLecture($template->teacher, [
                            'title' => $template->title,
                            'description' => $template->description,
                            'grade_id' => $template->grade_id,
                            'group_id' => $template->group_id,
                            'start_time' => $startDateTime,
                            'end_time' => $startDateTime->copy()->addMinutes($duration),
                            'is_active' => false,
                            'parent_id' => $template->id,
                        ]);
                    }
                }
            }
        }

        $this->info('Done.');
    }
}
