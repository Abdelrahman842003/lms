<?php

declare(strict_types=1);

namespace App\Domains\Exams\Jobs;

use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Notifications\ExamActivatedNotification;
use App\Domains\Exams\Notifications\ExamStatusNotification;
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
        protected Exam $exam,
    ) {}

    public function handle(): void
    {
        $this->exam->refresh();

        if ($this->exam->date && $this->exam->date->isFuture()) {
            if ($this->exam->date->diffInMinutes(now()) > 1) {
                Log::info("ProcessExamStart: Skipped premature activation for {$this->exam->id}.");
                return;
            }
        }

        if ($this->exam->ended_at) {
            Log::info("ProcessExamStart: Skipped activation for {$this->exam->id}. Exam already ended.");
            return;
        }

        if (! $this->exam->is_active) {
            $this->exam->update([
                'is_active'    => true,
                'activated_at' => now(),
            ]);

            $this->exam->refresh();

            Log::info("ProcessExamStart: Activated exam {$this->exam->id}");

            $this->exam->teacher->notify(new ExamStatusNotification($this->exam, 'active'));

            $this->notifyStudents();

            $endTime = now()->addMinutes($this->exam->duration);
            $delay   = max(0, now()->diffInSeconds($endTime, false));
            ProcessExamEnd::dispatch($this->exam)->delay($delay);
            Log::info("ProcessExamStart: Scheduled end for {$this->exam->id} in {$delay}s at {$endTime}");
        }
    }

    private function notifyStudents(): void
    {
        $query = \App\Domains\Auth\Models\Student::whereHas('enrollments', function ($q) {
            $q->where('teacher_id', $this->exam->teacher_id)
              ->where('is_active', true);
        });

        if ($this->exam->grade_id) {
            $query->whereHas('enrollments', fn ($q) => $q->where('grade_id', $this->exam->grade_id));
        }

        if ($this->exam->group_id) {
            $query->whereHas('enrollments', fn ($q) => $q->where('group_id', $this->exam->group_id));
        }

        $students = $query->get();

        if ($students->count() > 0) {
            Notification::send($students, new ExamActivatedNotification($this->exam));
            Log::info("ProcessExamStart: Notified {$students->count()} students for exam {$this->exam->id}");
        }
    }
}
