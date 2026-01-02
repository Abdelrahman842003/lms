<?php

namespace App\Console\Commands;

use App\Models\Lecture;
use App\Http\Controllers\Teacher\LectureController;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class ActivateScheduledLectures extends Command
{
    protected $signature = 'lectures:activate';
    protected $description = 'Activate lectures that have reached their start time';

    public function handle()
    {
        $this->info('Checking for lectures to activate...');

        $lecturesToActivate = Lecture::where('is_active', false)
            ->where('is_recurring', false) // Don't activate templates
            ->where('start_time', '<=', now())
            ->where('end_time', '>', now())
            ->get();

        $this->info("Found {$lecturesToActivate->count()} lectures to activate.");

        $lectureController = app(LectureController::class);

        foreach ($lecturesToActivate as $lecture) {
            $this->info("Activating lecture: {$lecture->title} (ID: {$lecture->id})");
            
            // We can reuse the controller logic or service logic. 
            // Since the controller has the notification logic, we might want to use it or extract it.
            // For now, let's replicate the logic to avoid Request object dependency if possible, 
            // or just call the service and send notification manually.
            
            $lecture->update(['is_active' => true]);

            try {
                // Get active students enrolled in this grade
                $students = $lecture->teacher->students()
                    ->wherePivot('grade_id', $lecture->grade_id)
                    ->wherePivot('is_active', true)
                    ->get();

                if ($students->count() > 0) {
                    \Illuminate\Support\Facades\Notification::send(
                        $students, 
                        new \App\Notifications\LectureActivatedNotification(
                            $lecture->title, 
                            $lecture->teacher->name, 
                            $lecture->id
                        )
                    );
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send lecture activation notification: ' . $e->getMessage());
            }
        }

        $this->info('Done.');
    }
}
