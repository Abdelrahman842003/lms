<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Student;

use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamAttempt;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Exams\Models\Question;
use App\Domains\Auth\Models\Student;
use App\Domains\Exams\Models\StudentAnswer;
use App\Domains\Exams\Notifications\ExamResultNotification;
use App\Domains\Application\Services\Student\MistakesService;
use App\Domains\Gamification\Services\PointService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentExamService
{
    public function __construct(
        private PointService $pointService,
        private MistakesService $mistakesService,
        private \App\Domains\Exams\Builders\ExamAttemptBuilder $attemptBuilder
    ) {}

    /**
     * Get exam details
     */
    public function getExamDetails(Exam $exam): \App\Domains\Exams\DTOs\StudentExamData
    {
        return \App\Domains\Exams\DTOs\StudentExamData::fromArray([
            'id' => $exam->id,
            'title' => $exam->title,
            'subject' => $exam->subject,
            'duration' => $exam->duration,
            'max_score' => $exam->max_score,
            'actual_question_count' => $exam->actual_question_count,
            'time_per_question' => $exam->time_per_question,
            'date' => $exam->date,
            'is_active' => $exam->is_active,
        ]);
    }

    /**
     * Check if student has completed exam
     */
    public function hasStudentCompleted(Student $student, Exam $exam): bool
    {
        return ExamResult::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->exists();
    }

    /**
     * Get student's result for an exam
     */
    public function getStudentResult(Student $student, Exam $exam): ?\App\Domains\Exams\Models\ExamResult
    {
        return ExamResult::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();
    }

    /**
     * Get exams for a student and teacher
     */
    public function getExams(Student $student, string $teacherId, int $perPage = 10): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Exam::where('teacher_id', $teacherId)
            ->with(['results' => function ($q) use ($student) {
                $q->where('student_id', $student->id);
            }])
            ->orderBy('is_active', 'desc')
            ->latest();

        return $query->paginate($perPage);
    }

    /**
     * Start an exam for a student
     */
    public function startExam(Student $student, Exam $exam): array
    {
        // Check if student already has an attempt
        $existingAttempt = ExamAttempt::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existingAttempt) {
            if ($existingAttempt->status === 'in_progress') {
                // Check if questions still exist (in case exam was edited)
                $questionsCount = Question::whereIn('id', $existingAttempt->questions_order)->count();

                if ($questionsCount !== count($existingAttempt->questions_order)) {
                    // Exam was modified, delete invalid attempt and start over
                    $existingAttempt->delete();
                    // Create a new attempt after deletion
                    $newAttempt = $this->attemptBuilder->createAttempt($exam, $student->id);
                    return $this->getAttemptData($newAttempt);
                }

                // Return existing attempt
                return $this->getAttemptData($existingAttempt);
            }

            throw new \Exception('لقد قمت بأداء هذا الامتحان مسبقاً');
        }

        // No existing attempt, create a new one
        $newAttempt = $this->attemptBuilder->createAttempt($exam, $student->id);
        return $this->getAttemptData($newAttempt);
    }

    /**
     * Build attempt data array for response
     */
    private function getAttemptData(ExamAttempt $attempt): array
    {
        $attempt->load('exam.questions');

        return [
            'attempt_id' => $attempt->id,
            'exam_id' => $attempt->exam_id,
            'questions' => $this->buildQuestionsData($attempt),
            'current_question_index' => $attempt->current_question_index ?? 0,
            'time_remaining' => $this->calculateTimeRemaining($attempt),
            'status' => $attempt->status,
        ];
    }

    /**
     * Build questions data for the attempt
     */
    private function buildQuestionsData(ExamAttempt $attempt): array
    {
        $questions = Question::whereIn('id', $attempt->questions_order)
            ->get()
            ->keyBy('id');

        return collect($attempt->questions_order)->map(function ($questionId) use ($questions) {
            $question = $questions->get($questionId);
            if (!$question) {
                return null;
            }

            return [
                'id' => $question->id,
                'text' => $question->text,
                'options' => $question->options,
                'duration' => $question->duration ?? 60,
                // لا نُرسل الإجابة الصحيحة
            ];
        })->filter()->values()->all();
    }

    /**
     * Calculate remaining time for the exam attempt
     */
    private function calculateTimeRemaining(ExamAttempt $attempt): int
    {
        $exam = $attempt->exam;
        $elapsed = now()->diffInSeconds($attempt->started_at);
        $totalTime = $exam->duration * 60; // Convert minutes to seconds
        return max(0, $totalTime - $elapsed);
    }
}
