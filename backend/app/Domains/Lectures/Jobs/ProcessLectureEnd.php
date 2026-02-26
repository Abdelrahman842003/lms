<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Jobs;

use App\Domains\Lectures\Events\LectureUpdated;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Notifications\LectureStatusNotification;
use App\Domains\Lectures\Notifications\StudentAbsentNotification;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessLectureEnd implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $queue = 'default';

    public function __construct(
        protected Lecture $lecture,
    ) {}

    public function handle(): void
    {
        if ($this->lecture->is_active) {
            $this->lecture->update(['is_active' => false]);
            $this->lecture->refresh();

            LectureUpdated::dispatch($this->lecture);

            Log::info("ProcessLectureEnd: Auto-deactivated lecture {$this->lecture->id}");

            $this->lecture->teacher->notify(new LectureStatusNotification($this->lecture, 'finished'));
        }

        $teacher = $this->lecture->teacher;

        if (! $teacher) {
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

            if (! $hasAttended) {
                Attendance::create([
                    'lecture_id' => $this->lecture->id,
                    'student_id' => $student->id,
                    'status'     => 'absent',
                ]);

                try {
                    $student->notify(new StudentAbsentNotification(
                        $this->lecture->title,
                        $teacher->name,
                        $this->lecture->academy->name,
                    ));
                } catch (\Exception $e) {
                    Log::error("ProcessLectureEnd: Notification failed for student {$student->id}", [
                        'error' => $e->getMessage(),
                    ]);
                }

                $absentCount++;
            }
        }

        Log::info("ProcessLectureEnd: Completed for lecture {$this->lecture->id}", [
            'total_students' => $activeStudents->count(),
            'absent_marked'  => $absentCount,
        ]);

        // جدولة الحصة التالية للمحاضرات المتكررة
        if ($this->lecture->is_recurring && $this->lecture->recurrence_days && $this->lecture->recurrence_time) {
            $now            = now();
            $nextOccurrence = null;

            for ($i = 1; $i <= 7; $i++) {
                $date = $now->copy()->addDays($i)->setTimezone('Africa/Cairo');
                if (in_array($date->format('l'), $this->lecture->recurrence_days)) {
                    $nextOccurrence = Carbon::parse(
                        $date->format('Y-m-d') . ' ' . $this->lecture->recurrence_time,
                        'Africa/Cairo',
                    )->setTimezone('UTC');
                    break;
                }
            }

            if ($nextOccurrence) {
                $delay = max(0, now()->diffInSeconds($nextOccurrence, false));
                ProcessLectureStart::dispatch($this->lecture)->delay($delay);
                Log::info("ProcessLectureEnd: Scheduled next occurrence for {$this->lecture->id} in {$delay}s");
            }
        }
    }
}
