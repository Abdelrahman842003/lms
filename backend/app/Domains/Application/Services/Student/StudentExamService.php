<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Student;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Exams\Enums\ExamAttemptStatus;
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
        /** @var ExamAttempt|null $existingAttempt */
        $existingAttempt = ExamAttempt::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existingAttempt) {
            if ($this->getStatusValue($existingAttempt) === ExamAttemptStatus::IN_PROGRESS->value) {
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

            throw new DomainException('لقد قمت بأداء هذا الامتحان مسبقاً');
        }

        // No existing attempt, create a new one
        $newAttempt = $this->attemptBuilder->createAttempt($exam, $student->id);
        return $this->getAttemptData($newAttempt);
    }

    /**
     * Submit answer for current question.
     *
     * @throws DomainException
     */
    public function submitAnswer(ExamAttempt $attempt, ?string $answer): array
    {
        $this->ensureAttemptInProgress($attempt);

        $question = $attempt->getCurrentQuestion();
        if (! $question) {
            return $this->finalizeAttempt($attempt, ExamAttemptStatus::COMPLETED->value);
        }

        $normalizedAnswer = trim((string) $answer);
        if ($normalizedAnswer === '') {
            throw new DomainException('الرجاء اختيار إجابة قبل المتابعة.', 422);
        }

        $correctAnswer = trim((string) ($question->correct_answer ?? ''));
        $options = is_array($question->options) ? $question->options : [];

        if ($correctAnswer !== '' && ! array_is_list($options) && array_key_exists($correctAnswer, $options)) {
            $correctAnswer = trim((string) $options[$correctAnswer]);
        }

        $isCorrect = mb_strtolower($normalizedAnswer) === mb_strtolower($correctAnswer);

        StudentAnswer::updateOrCreate(
            [
                'exam_attempt_id' => $attempt->id,
                'question_id' => $question->id,
            ],
            [
                'answer' => $normalizedAnswer,
                'is_correct' => $isCorrect,
                'answered_at' => now(),
            ]
        );

        $nextIndex = (int) $attempt->current_question_index + 1;
        $totalQuestions = count((array) $attempt->questions_order);

        if ($nextIndex >= $totalQuestions) {
            $attempt->update(['current_question_index' => $totalQuestions]);
            return $this->finalizeAttempt($attempt, ExamAttemptStatus::COMPLETED->value);
        }

        $attempt->update(['current_question_index' => $nextIndex]);

        return $this->getAttemptData($attempt->fresh());
    }

    /**
     * Skip current question (e.g. time expired).
     *
     * @throws DomainException
     */
    public function skipQuestion(ExamAttempt $attempt): array
    {
        $this->ensureAttemptInProgress($attempt);

        $question = $attempt->getCurrentQuestion();
        if (! $question) {
            return $this->finalizeAttempt($attempt, ExamAttemptStatus::COMPLETED->value);
        }

        StudentAnswer::updateOrCreate(
            [
                'exam_attempt_id' => $attempt->id,
                'question_id' => $question->id,
            ],
            [
                'answer' => null,
                'is_correct' => false,
                'answered_at' => now(),
            ]
        );

        $nextIndex = (int) $attempt->current_question_index + 1;
        $totalQuestions = count((array) $attempt->questions_order);

        if ($nextIndex >= $totalQuestions) {
            $attempt->update(['current_question_index' => $totalQuestions]);
            return $this->finalizeAttempt($attempt, ExamAttemptStatus::COMPLETED->value);
        }

        $attempt->update(['current_question_index' => $nextIndex]);

        return $this->getAttemptData($attempt->fresh());
    }

    /**
     * Terminate an in-progress exam attempt (anti-cheating or timeout).
     */
    public function terminateExam(ExamAttempt $attempt, ?string $reason = null): array
    {
        $status = $this->getStatusValue($attempt);

        if ($status === ExamAttemptStatus::TERMINATED->value || $status === ExamAttemptStatus::COMPLETED->value) {
            return $this->getAttemptData($attempt);
        }

        return $this->finalizeAttempt(
            $attempt,
            ExamAttemptStatus::TERMINATED->value,
            $reason ?: 'manual_termination'
        );
    }

    /**
     * Get student's final result for exam.
     */
    public function getResult(Student $student, Exam $exam): ?array
    {
        $result = ExamResult::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();

        if (! $result) {
            return null;
        }

        $attempt = ExamAttempt::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();

        $totalQuestions = $attempt ? count((array) $attempt->questions_order) : (int) ($exam->actual_question_count ?? 0);
        $correctAnswers = $attempt
            ? StudentAnswer::where('exam_attempt_id', $attempt->id)->where('is_correct', true)->count()
            : 0;

        return [
            'score' => (float) $result->score,
            'max_score' => (float) ($exam->max_score ?? $totalQuestions),
            'percentage' => (float) $result->percentage,
            'correct_answers' => $correctAnswers,
            'total_questions' => $totalQuestions,
            'terminated' => $attempt ? $this->getStatusValue($attempt) === ExamAttemptStatus::TERMINATED->value : false,
            'terminated_reason' => $attempt?->terminated_reason,
        ];
    }

    /**
     * Build attempt data array for response
     */
    public function getAttemptData(ExamAttempt $attempt): array
    {
        $attempt->loadMissing('exam');

        $status = $this->getStatusValue($attempt);
        $totalQuestions = count((array) $attempt->questions_order);
        $currentIndex = (int) ($attempt->current_question_index ?? 0);

        $question = null;
        if ($status === ExamAttemptStatus::IN_PROGRESS->value) {
            $currentQuestion = $attempt->getCurrentQuestion();
            if ($currentQuestion) {
                $question = [
                    'id' => $currentQuestion->id,
                    'text' => $currentQuestion->text,
                    'options' => $this->normalizeOptions($currentQuestion->options),
                ];
            }
        }

        $response = [
            'status' => $status,
            'attempt_id' => $attempt->id,
            'exam' => [
                'id' => $attempt->exam->id,
                'title' => $attempt->exam->title,
                'subject' => $attempt->exam->subject,
                'time_per_question' => (int) ($attempt->exam->time_per_question ?? 60),
            ],
            'progress' => [
                'current' => $totalQuestions > 0
                    ? min($currentIndex + 1, $totalQuestions)
                    : 0,
                'total' => $totalQuestions,
            ],
            'question' => $question,
        ];

        if ($status !== ExamAttemptStatus::IN_PROGRESS->value) {
            $response['result'] = $this->buildResultData($attempt);
        }

        return $response;
    }

    /**
     * Normalize options payload for frontend consumption.
     *
     * @param mixed $rawOptions
     * @return array<int, string>
     */
    private function normalizeOptions(mixed $rawOptions): array
    {
        if (! is_array($rawOptions)) {
            return [];
        }

        if (array_is_list($rawOptions)) {
            return array_values(array_map(static fn ($option): string => (string) $option, $rawOptions));
        }

        return array_values(array_map(static fn ($option): string => (string) $option, $rawOptions));
    }

    private function ensureAttemptInProgress(ExamAttempt $attempt): void
    {
        if ($this->getStatusValue($attempt) !== ExamAttemptStatus::IN_PROGRESS->value) {
            throw new DomainException('هذه المحاولة منتهية أو مُلغاة.', 409);
        }
    }

    private function getStatusValue(ExamAttempt $attempt): string
    {
        $status = $attempt->status;
        if ($status instanceof ExamAttemptStatus) {
            return $status->value;
        }

        return (string) $status;
    }

    private function buildResultData(ExamAttempt $attempt): array
    {
        $attempt->loadMissing('exam');

        $totalQuestions = count((array) $attempt->questions_order);
        $correctAnswers = StudentAnswer::where('exam_attempt_id', $attempt->id)
            ->where('is_correct', true)
            ->count();

        $maxScore = (float) ($attempt->exam->max_score ?? $totalQuestions);
        $score = $totalQuestions > 0
            ? round(($correctAnswers / $totalQuestions) * $maxScore, 2)
            : 0.0;
        $percentage = $totalQuestions > 0
            ? round(($correctAnswers / $totalQuestions) * 100, 2)
            : 0.0;

        return [
            'score' => $score,
            'max_score' => $maxScore,
            'percentage' => $percentage,
            'correct_answers' => $correctAnswers,
            'total_questions' => $totalQuestions,
            'terminated' => $this->getStatusValue($attempt) === ExamAttemptStatus::TERMINATED->value,
            'terminated_reason' => $attempt->terminated_reason,
        ];
    }

    private function finalizeAttempt(ExamAttempt $attempt, string $status, ?string $terminatedReason = null): array
    {
        return DB::transaction(function () use ($attempt, $status, $terminatedReason): array {
            $attempt->refresh();
            $attempt->loadMissing('exam', 'student');

            $this->syncMistakesFromAttempt($attempt);

            $totalQuestions = count((array) $attempt->questions_order);
            $correctAnswers = StudentAnswer::where('exam_attempt_id', $attempt->id)
                ->where('is_correct', true)
                ->count();

            $maxScore = (float) ($attempt->exam->max_score ?? $totalQuestions);
            $score = $totalQuestions > 0
                ? round(($correctAnswers / $totalQuestions) * $maxScore, 2)
                : 0.0;
            $percentage = $totalQuestions > 0
                ? round(($correctAnswers / $totalQuestions) * 100, 2)
                : 0.0;

            $updateData = [
                'status' => $status,
                'completed_at' => now(),
                'current_question_index' => $totalQuestions,
            ];

            if ($status === ExamAttemptStatus::TERMINATED->value) {
                $updateData['terminated_reason'] = $terminatedReason;
            }

            $attempt->update($updateData);

            $result = ExamResult::updateOrCreate(
                [
                    'exam_id' => $attempt->exam_id,
                    'student_id' => $attempt->student_id,
                ],
                [
                    'attempt_id' => $attempt->id,
                    'score' => $score,
                    'percentage' => $percentage,
                ]
            );

            if ($attempt->student) {
                $attempt->student->notify(new ExamResultNotification($result->fresh(['exam']), [
                    'has_previous' => false,
                    'message' => $status === ExamAttemptStatus::TERMINATED->value
                        ? 'تم إنهاء الامتحان بسبب مخالفة.'
                        : 'تم تسجيل نتيجة الامتحان بنجاح.',
                ]));
            }

            return $this->getAttemptData($attempt->fresh());
        });
    }

    private function syncMistakesFromAttempt(ExamAttempt $attempt): void
    {
        $attempt->loadMissing('exam', 'student');

        if (! $attempt->student || ! $attempt->exam) {
            return;
        }

        StudentAnswer::where('exam_attempt_id', $attempt->id)
            ->where('is_correct', false)
            ->with('question')
            ->get()
            ->each(function (StudentAnswer $answer) use ($attempt): void {
                if (! $answer->question) {
                    return;
                }

                $this->mistakesService->trackWrongAnswer(
                    $attempt->student,
                    $answer->question,
                    $attempt->exam,
                    $answer->answer
                );
            });
    }

    /**
     * Calculate remaining time for the exam attempt
     */
    private function calculateTimeRemaining(ExamAttempt $attempt): int
    {
        $exam = $attempt->exam;
        $elapsed = (int) now()->diffInSeconds($attempt->started_at ?? now(), true);
        $durationMinutes = (float) ($exam->duration ?? 0);
        $totalTime = (int) round($durationMinutes * 60); // Convert minutes to seconds

        return max(0, $totalTime - $elapsed);
    }
}
