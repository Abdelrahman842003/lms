<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\FailedQuestion;
use App\Models\Question;
use App\Models\Student;
use Illuminate\Support\Collection;

class MistakesService
{
    /**
     * Track a wrong answer
     */
    public function trackWrongAnswer(
        Student $student,
        Question $question,
        Exam $exam,
        ?string $studentAnswer = null
    ): FailedQuestion {
        $teacherId = $exam->teacher_id;

        $failedQuestion = FailedQuestion::where('student_id', $student->id)
            ->where('question_id', $question->id)
            ->first();

        if ($failedQuestion) {
            // Already tracked, increment failure count
            $failedQuestion->incrementFailed($studentAnswer);
            // Reset mastered status if they got it wrong again
            if ($failedQuestion->is_mastered) {
                $failedQuestion->update([
                    'is_mastered' => false,
                    'mastered_at' => null,
                ]);
            }
            return $failedQuestion;
        }

        // New failed question
        return FailedQuestion::create([
            'student_id' => $student->id,
            'teacher_id' => $teacherId,
            'question_id' => $question->id,
            'exam_id' => $exam->id,
            'student_answer' => $studentAnswer,
            'times_failed' => 1,
        ]);
    }

    /**
     * Get student's mistakes for a teacher
     */
    public function getMistakes(string $studentId, string $teacherId, bool $includesMastered = false): Collection
    {
        $query = FailedQuestion::where('student_id', $studentId)
            ->where('teacher_id', $teacherId)
            ->with(['question', 'exam:id,title,subject']);

        if (!$includesMastered) {
            $query->unmastered();
        }

        return $query->orderByDesc('times_failed')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'question' => [
                        'id' => $item->question->id,
                        'text' => $item->question->text,
                        'options' => $item->question->options,
                        'correct_answer' => $item->question->correct_answer,
                    ],
                    'exam' => $item->exam,
                    'student_answer' => $item->student_answer,
                    'times_failed' => $item->times_failed,
                    'is_mastered' => $item->is_mastered,
                    'mastered_at' => $item->mastered_at,
                    'created_at' => $item->created_at,
                ];
            });
    }

    /**
     * Get statistics about mistakes
     */
    public function getStats(string $studentId, string $teacherId): array
    {
        $total = FailedQuestion::where('student_id', $studentId)
            ->where('teacher_id', $teacherId)
            ->count();

        $mastered = FailedQuestion::where('student_id', $studentId)
            ->where('teacher_id', $teacherId)
            ->where('is_mastered', true)
            ->count();

        $pending = $total - $mastered;

        // Get most failed exams/subjects
        $byExam = FailedQuestion::where('student_id', $studentId)
            ->where('teacher_id', $teacherId)
            ->unmastered()
            ->with('exam:id,title,subject')
            ->get()
            ->groupBy('exam_id')
            ->map(fn($items) => [
                'exam' => $items->first()->exam,
                'count' => $items->count(),
            ])
            ->sortByDesc('count')
            ->take(5)
            ->values();

        return [
            'total_mistakes' => $total,
            'mastered' => $mastered,
            'pending' => $pending,
            'mastery_rate' => $total > 0 ? round(($mastered / $total) * 100, 1) : 0,
            'by_exam' => $byExam,
        ];
    }

    /**
     * Get review quiz questions
     */
    public function getReviewQuiz(string $studentId, string $teacherId, int $limit = 10): array
    {
        $questions = FailedQuestion::where('student_id', $studentId)
            ->where('teacher_id', $teacherId)
            ->unmastered()
            ->with('question')
            ->orderByDesc('times_failed')
            ->limit($limit)
            ->get();

        if ($questions->isEmpty()) {
            return [
                'questions' => [],
                'total' => 0,
                'message' => 'ما عندكش أخطاء للمراجعة! 🎉',
            ];
        }

        return [
            'questions' => $questions->map(function ($item) {
                $options = $item->question->options;
                shuffle($options);
                return [
                    'failed_question_id' => $item->id,
                    'question_id' => $item->question->id,
                    'text' => $item->question->text,
                    'options' => $options,
                    'times_failed' => $item->times_failed,
                ];
            }),
            'total' => $questions->count(),
        ];
    }

    /**
     * Check answer in review quiz and update mastery
     */
    public function checkReviewAnswer(string $failedQuestionId, string $answer): array
    {
        $failedQuestion = FailedQuestion::with('question')->findOrFail($failedQuestionId);
        $isCorrect = $failedQuestion->question->correct_answer === $answer;

        if ($isCorrect) {
            $failedQuestion->markAsMastered();
        } else {
            $failedQuestion->incrementFailed($answer);
        }

        return [
            'is_correct' => $isCorrect,
            'correct_answer' => $failedQuestion->question->correct_answer,
            'is_mastered' => $isCorrect,
        ];
    }

    /**
     * Mark a question as mastered manually
     */
    public function markAsMastered(string $failedQuestionId, string $studentId): bool
    {
        $failedQuestion = FailedQuestion::where('id', $failedQuestionId)
            ->where('student_id', $studentId)
            ->first();

        if (!$failedQuestion) {
            return false;
        }

        $failedQuestion->markAsMastered();
        return true;
    }
}
