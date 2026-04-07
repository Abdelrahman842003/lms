<?php

declare(strict_types=1);

namespace App\Domains\Exams\Builders;

use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamAttempt;
use App\Domains\Exams\Models\Question;
use Illuminate\Support\Collection;

/**
 * Builder لبناء مجموعة أسئلة عشوائية لكل محاولة امتحان.
 *
 * المميزات:
 *  - ترتيب عشوائي للأسئلة (مختلف لكل طالب)
 *  - خلط خيارات MCQ
 *  - يحترم actual_question_count من الـ Exam
 */
final class ExamAttemptBuilder
{
    /**
     * يبني ترتيب الأسئلة العشوائي لمحاولة معينة.
     *
     * @return array<string> مصفوفة IDs مرتبة عشوائياً
     */
    public function build(Exam $exam): array
    {
        $questions = Question::where('exam_id', $exam->id)
            ->pluck('id')
            ->shuffle();

        $count = $exam->actual_question_count ?? $questions->count();

        return $questions->take($count)->values()->all();
    }

    /**
     * يخلط خيارات سؤال MCQ — يعيد الـ options بترتيب مختلف مع تتبع الإجابة الصحيحة.
     *
     * @param  array<string, string>  $options  ['A' => 'نص', 'B' => 'نص', ...]
     * @param  string  $correctKey  المفتاح الصحيح الأصلي
     * @return array{options: array, correct_key: string}
     */
    public function shuffleOptions(array $options, string $correctKey): array
    {
        $correctValue = $options[$correctKey] ?? null;

        $shuffled = collect($options)->shuffle()->values()->all();

        // إيجاد المفتاح الجديد للإجابة الصحيحة
        $keys        = array_keys($options);
        $newCorrectKey = array_search($correctValue, $shuffled, true);
        $newKey      = $keys[$newCorrectKey] ?? $correctKey;

        return [
            'options'     => $shuffled,
            'correct_key' => (string) $newCorrectKey,
        ];
    }

    /**
     * يُنشئ ExamAttempt جديدة بترتيب عشوائي.
     */
    public function createAttempt(Exam $exam, string $studentId): ExamAttempt
    {
        $questionsOrder = $this->build($exam);

        return ExamAttempt::create([
            'exam_id'                => $exam->id,
            'student_id'             => $studentId,
            'started_at'             => now(),
            'status'                 => 'in_progress',
            'questions_order'        => $questionsOrder,
            'current_question_index' => 0,
        ]);
    }
}
