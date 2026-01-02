<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Attendance;
use App\Models\Lecture;
use App\Notifications\StudentAbsentNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessLectureEnd implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Lecture $lecture
    ) {}

    public function handle(): void
    {
        $teacher = $this->lecture->teacher;
        
        if (!$teacher) {
            Log::error("ProcessLectureEnd: Teacher not found for lecture {$this->lecture->id}");
            return;
        }

        $activeStudents = $teacher->activeStudents()
            ->wherePivot('grade_id', $this->lecture->grade_id)
            ->get();

        $absentCount = 0;

        foreach ($activeStudents as $student) {
            $hasAttended = $this->lecture->attendances()
                ->where('student_id', $student->id)
                ->exists();

            if (!$hasAttended) {
                Attendance::create([
                    'lecture_id' => $this->lecture->id,
                    'student_id' => $student->id,
                    'status' => 'absent',
                ]);

                try {
                    $student->notify(new StudentAbsentNotification(
                        $this->lecture->title,
                        $teacher->name
                    ));
                } catch (\Exception $e) {
                    Log::error("ProcessLectureEnd: Notification failed for student {$student->id}", [
                        'error' => $e->getMessage()
                    ]);
                }

                $absentCount++;
            }
        }

        Log::info("ProcessLectureEnd: Completed for lecture {$this->lecture->id}", [
            'total_students' => $activeStudents->count(),
            'absent_marked' => $absentCount
        ]);
    }
}

