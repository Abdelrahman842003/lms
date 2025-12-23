<?php

namespace App\Jobs;

use App\Models\Lecture;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessLectureEnd implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $lecture;

    /**
     * Create a new job instance.
     */
    public function __construct(Lecture $lecture)
    {
        $this->lecture = $lecture;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        \Illuminate\Support\Facades\Log::info("ProcessLectureEnd Job Started for Lecture ID: {$this->lecture->id}");

        // Get all active students for this teacher
        $teacher = $this->lecture->teacher;
        
        if (!$teacher) {
            \Illuminate\Support\Facades\Log::error("Teacher not found for lecture {$this->lecture->id}");
            return;
        }

        $activeStudents = $teacher->activeStudents()
            ->wherePivot('grade_id', $this->lecture->grade_id)
            ->get();
            
        \Illuminate\Support\Facades\Log::info("Found " . $activeStudents->count() . " active students for teacher {$teacher->id} in grade {$this->lecture->grade_id}");

        foreach ($activeStudents as $student) {
            // Check if student already has an attendance record for this lecture
            $hasAttended = $this->lecture->attendances()
                ->where('student_id', $student->id)
                ->exists();

            if (!$hasAttended) {
                \Illuminate\Support\Facades\Log::info("Student {$student->id} did not attend. Creating absent record.");
                
                // Create absent record
                \App\Models\Attendance::create([
                    'lecture_id' => $this->lecture->id,
                    'student_id' => $student->id,
                    'status' => 'absent',
                    'attended_at' => null,
                ]);

                // Send notification
                try {
                    $student->notify(new \App\Notifications\StudentAbsentNotification($this->lecture->title, $teacher->name));
                    \Illuminate\Support\Facades\Log::info("Notification sent to student {$student->id}");
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send notification to student {$student->id}: " . $e->getMessage());
                }
            } else {
                \Illuminate\Support\Facades\Log::info("Student {$student->id} attended.");
            }
        }
        
        \Illuminate\Support\Facades\Log::info("ProcessLectureEnd Job Completed");
    }
}
