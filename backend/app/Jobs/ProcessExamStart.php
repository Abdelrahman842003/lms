<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Exam;
use App\Notifications\ExamActivatedNotification;
use App\Notifications\ExamStatusNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class ProcessExamStart implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Exam $exam
    ) {}

    public function handle(): void
    {
        $this->exam->refresh();

        // Safety check: If exam date is in the future, don't activate yet
        if ($this->exam->date && $this->exam->date->isFuture()) {
            if ($this->exam->date->diffInMinutes(now()) > 1) {
                Log::info("ProcessExamStart: Skipped premature activation for {$this->exam->id}. Start time is future.");
                return;
            }
        }

        // Don't activate if already ended
        if ($this->exam->ended_at) {
            Log::info("ProcessExamStart: Skipped activation for {$this->exam->id}. Exam already ended.");
            return;
        }

        if (!$this->exam->is_active) {
            $this->exam->update([
                'is_active' => true,
                'activated_at' => now(),
            ]);
            
            // Refresh to get updated data
            $this->exam->refresh();
            
            Log::info("ProcessExamStart: Activated exam {$this->exam->id}");
            
            // Notify teacher immediately for real-time UI update
            $this->exam->teacher->notify(new ExamStatusNotification($this->exam, 'active'));
            
            // Notify students
            $this->notifyStudents();
            
            // Schedule end job
            $endTime = now()->addMinutes($this->exam->duration);
            $delay = max(0, now()->diffInSeconds($endTime, false));
            ProcessExamEnd::dispatch($this->exam)->delay($delay);
            Log::info("ProcessExamStart: Scheduled end for {$this->exam->id} in {$delay}s at {$endTime}");
        }
    }

    private function notifyStudents(): void
    {
        $query = \App\Models\Student::whereHas('enrollments', function ($q) {
            $q->where('teacher_id', $this->exam->teacher_id)
              ->where('is_active', true);
        });

        if ($this->exam->grade_id) {
            $query->whereHas('enrollments', function ($q) {
                $q->where('grade_id', $this->exam->grade_id);
            });
        }

        if ($this->exam->group_id) {
            $query->whereHas('enrollments', function ($q) {
                $q->where('group_id', $this->exam->group_id);
            });
        }

        $students = $query->get();
        
        if ($students->count() > 0) {
            Notification::send($students, new ExamActivatedNotification($this->exam));
            Log::info("ProcessExamStart: Notified {$students->count()} students for exam {$this->exam->id}");
        }
    }
}
