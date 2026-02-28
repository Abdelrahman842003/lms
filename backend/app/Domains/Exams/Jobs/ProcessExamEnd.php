<?php

declare(strict_types=1);

namespace App\Domains\Exams\Jobs;

use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Exams\Notifications\ExamAbsentNotification;
use App\Domains\Exams\Notifications\ExamStatusNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessExamEnd implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;


    public function __construct(
        protected Exam $exam,
    ) {}

    public function handle(): void
    {
        $this->exam->refresh();

        if (! $this->exam->is_active || $this->exam->ended_at) {
            Log::info("ProcessExamEnd: Skipped for {$this->exam->id}. Already inactive or ended.");
            return;
        }

        $this->exam->update([
            'is_active' => false,
            'ended_at'  => now(),
        ]);

        $this->exam->refresh();

        Log::info("ProcessExamEnd: Auto-ended exam {$this->exam->id}");

        $this->exam->teacher->notify(new ExamStatusNotification($this->exam, 'ended'));

        $this->processResults();
    }

    private function processResults(): void
    {
        $examService = app(\App\Domains\Application\Services\Student\StudentExamService::class);

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

        $students    = $query->get();
        $absentCount = 0;

        foreach ($students as $student) {
            $attempt = $this->exam->attempts()->where('student_id', $student->id)->first();

            if ($attempt) {
                if ($attempt->status === 'in_progress') {
                    $examService->terminateExam($attempt, 'time_limit_exceeded');
                }
            } else {
                $existingResult = ExamResult::where('exam_id', $this->exam->id)
                    ->where('student_id', $student->id)
                    ->exists();

                if (! $existingResult) {
                    ExamResult::create([
                        'exam_id'    => $this->exam->id,
                        'student_id' => $student->id,
                        'score'      => 0,
                        'percentage' => 0,
                        'status'     => 'absent',
                    ]);

                    try {
                        $student->notify(new ExamAbsentNotification($this->exam));
                    } catch (\Exception $e) {
                        Log::error("ProcessExamEnd: Failed to notify absent student {$student->id}", [
                            'error' => $e->getMessage(),
                        ]);
                    }

                    $absentCount++;
                }
            }
        }

        Log::info("ProcessExamEnd: Completed for exam {$this->exam->id}", [
            'total_students' => $students->count(),
            'absent_marked'  => $absentCount,
        ]);
    }
}
