<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Student;

use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\FailedQuestion;
use App\Domains\Exams\Models\Question;
use App\Domains\Auth\Models\Student;
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
        $teacherProfileId = $exam->teacher_profile_id;

        /** @var FailedQuestion|null $failedQuestion */
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

            \App\Domains\Application\Services\CacheService::forgetMistakesStats($student->id, $teacherProfileId);
            return $failedQuestion;
        }

        // New failed question - using try-catch to handle rare race conditions
        try {
            $created = FailedQuestion::create([
                'student_id' => $student->id,
                'teacher_profile_id' => $teacherProfileId,
                'question_id' => $question->id,
                'exam_id' => $exam->id,
                'student_answer' => $studentAnswer,
                'times_failed' => 1,
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // If another process created it just now, retry the increment logic
            if ($e->getCode() === '23000') {
                $failedQuestion = FailedQuestion::where('student_id', $student->id)
                    ->where('question_id', $question->id)
                    ->first();
                
                if ($failedQuestion) {
                    $failedQuestion->incrementFailed($studentAnswer);
                    \App\Domains\Application\Services\CacheService::forgetMistakesStats($student->id, $teacherProfileId);
                    return $failedQuestion;
                }
            }
            throw $e;
        }

        \App\Domains\Application\Services\CacheService::forgetMistakesStats($student->id, $teacherProfileId);

        return $created;
    }

    /**
     * Get student's mistakes for a teacher
     */
    public function getMistakes(string $studentId, string $teacherProfileId): Collection
    {
        $query = FailedQuestion::where('student_id', $studentId)
            ->where('teacher_profile_id', $teacherProfileId)
            ->with(['question', 'exam:id,title,subject']);

        // Always unmastered now
        $query->unmastered();

        $results = $query->orderByDesc('times_failed')
            ->orderByDesc('created_at')
            ->get();

        return $results->map(function ($item) {
                return [
                    'id' => $item->id,
                    'question' => [
                        'id' => $item->question->id,
                        'text' => $item->question->text,
                        'type' => $item->question->type->value,
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
    public function getStats(string $studentId, string $teacherProfileId): array
    {
        return \App\Domains\Application\Services\CacheService::getMistakesStats($studentId, $teacherProfileId, function () use ($studentId, $teacherProfileId) {
            $total = FailedQuestion::where('student_id', $studentId)
                ->where('teacher_profile_id', $teacherProfileId)
                ->count();

            $mastered = FailedQuestion::where('student_id', $studentId)
                ->where('teacher_profile_id', $teacherProfileId)
                ->where('is_mastered', true)
                ->count();

            $pending = $total - $mastered;

            // Get most failed exams/subjects
            $byExam = FailedQuestion::where('student_id', $studentId)
                ->where('teacher_profile_id', $teacherProfileId)
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
        });
    }

    /**
     * Mark a question as mastered manually
     */
    public function markAsMastered(string $failedQuestionId, string $studentId): bool
    {
        /** @var FailedQuestion|null $failedQuestion */
        $failedQuestion = FailedQuestion::where('id', $failedQuestionId)
            ->where('student_id', $studentId)
            ->first();

        if (!$failedQuestion) {
            return false;
        }

        $failedQuestion->markAsMastered();
        \App\Domains\Application\Services\CacheService::forgetMistakesStats($studentId, $failedQuestion->teacher_profile_id);

        return true;
    }
}
