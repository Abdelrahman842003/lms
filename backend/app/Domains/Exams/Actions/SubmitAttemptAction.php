<?php

declare(strict_types=1);

namespace App\Domains\Exams\Actions;

use App\Domains\Exams\Events\ExamCompleted;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamAttempt;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Exams\Models\Question;
use App\Domains\Exams\Models\StudentAnswer;
use App\Domains\Application\Exceptions\DomainException;
use Illuminate\Support\Facades\DB;

final class SubmitAttemptAction
{
    /**
     * @param  array<string, string>  $answers  ['question_id' => 'student_answer']
     *
     * @throws DomainException
     */
    public function execute(ExamAttempt $attempt, int $studentId, array $answers): ExamResult
    {
        // 1. التحقق من أن المحاولة تخص الطالب
        if ((int) $attempt->student_id !== $studentId) {
            throw new DomainException('هذه المحاولة لا تخصك.', 403);
        }

        // 2. التحقق من أن المحاولة لا تزال جارية
        if ($attempt->status?->value !== 'in_progress') {
            throw new DomainException('هذه المحاولة منتهية أو مُلغاة.', 409);
        }

        return DB::transaction(function () use ($attempt, $answers, $studentId): ExamResult {
            $exam = $attempt->exam;

            // 3. جلب الأسئلة دفعة واحدة
            $questions = Question::whereIn('id', array_keys($answers))
                ->get()
                ->keyBy('id');

            $correctCount = 0;

            // 4. تسجيل الإجابات
            foreach ($answers as $questionId => $studentAnswer) {
                /** @var Question|null $question */
                $question = $questions->get($questionId);

                if (! $question) {
                    continue;
                }

                $isCorrect = trim((string) $studentAnswer) === trim((string) $question->correct_answer);

                if ($isCorrect) {
                    $correctCount++;
                }

                StudentAnswer::create([
                    'exam_attempt_id' => $attempt->id,
                    'question_id'     => $questionId,
                    'answer'          => $studentAnswer,
                    'is_correct'      => $isCorrect,
                    'answered_at'     => now(),
                ]);
            }

            // 5. حساب النتيجة
            $totalQuestions = $attempt->getTotalQuestionsCount() ?: 1;
            $score          = $correctCount;
            $maxScore       = $exam->max_score ?? $totalQuestions;
            $percentage     = round(($correctCount / $totalQuestions) * 100, 2);

            // 6. تحديث المحاولة
            $attempt->update([
                'status'       => 'completed',
                'completed_at' => now(),
            ]);

            // 7. إنشاء نتيجة الامتحان
            $result = ExamResult::create([
                'exam_id'    => $exam->id,
                'student_id' => $studentId,
                'attempt_id' => $attempt->id,
                'score'      => $score,
                'percentage' => $percentage,
            ]);

            // 8. إطلاق حدث الإكمال
            ExamCompleted::dispatch($attempt, (float) $score, $percentage);

            return $result;
        });
    }
}
