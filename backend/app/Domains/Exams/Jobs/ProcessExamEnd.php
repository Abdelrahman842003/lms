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

        $students = $query->get();
        $studentIds = $students->pluck('id')->toArray();
        $absentCount = 0;

        // Pre-load all attempts for this exam to avoid N+1 queries
        $attempts = $this->exam->attempts()
            ->whereIn('student_id', $studentIds)
            ->get()
            ->keyBy('student_id');

        // Pre-load all existing results to avoid N+1 queries
        $existingResults = ExamResult::where('exam_id', $this->exam->id)
            ->whereIn('student_id', $studentIds)
            ->pluck('student_id')
            ->flip()
            ->toArray();

        // Prepare batch insert for absent students
        $absentResultsToCreate = [];

        foreach ($students as $student) {
            $attempt = $attempts->get($student->id);

            if ($attempt) {
                if ($attempt->status === 'in_progress') {
                    $examService->terminateExam($attempt, 'time_limit_exceeded');
                }
            } else {
                // Check if result already exists using pre-loaded data
                if (!isset($existingResults[$student->id])) {
                    $absentResultsToCreate[] = [
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'exam_id' => $this->exam->id,
                        'student_id' => $student->id,
                        'score' => 0,
                        'percentage' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

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

        // Batch insert absent results (single query instead of N queries)
        if (!empty($absentResultsToCreate)) {
            ExamResult::insert($absentResultsToCreate);
        }

        Log::info("ProcessExamEnd: Completed for exam {$this->exam->id}", [
            'total_students' => $students->count(),
            'absent_marked' => $absentCount,
        ]);
    }
}
