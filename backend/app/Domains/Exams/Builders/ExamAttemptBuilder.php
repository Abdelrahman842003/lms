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
        // Case 1: Exams with pre-generated questions in pivot table (Preferred/New, supports both manual and pre-generated dynamic exams)
        $pivotQuestions = $exam->questions()->pluck('questions.id');

        if ($pivotQuestions->isNotEmpty()) {
            return $pivotQuestions->shuffle()->take($exam->actual_question_count ?? $pivotQuestions->count())->values()->all();
        }

        // Case 2: Dynamic exams without pre-generated questions (on-the-fly generation)
        if ($exam->type === 'dynamic' && !empty($exam->dynamic_settings)) {
            return $this->buildDynamicOrder($exam);
        }

        // Case 3: Legacy manual exams via exam_id column on questions table
        $legacyQuestions = Question::where('exam_id', $exam->id)
            ->pluck('id');

        if ($legacyQuestions->isNotEmpty()) {
            return $legacyQuestions->shuffle()->take($exam->actual_question_count ?? $legacyQuestions->count())->values()->all();
        }

        return [];
    }

    /**
     * Builds order for dynamic exams by picking questions from the teacher's bank.
     */
    private function buildDynamicOrder(Exam $exam): array
    {
        $settings = $exam->dynamic_settings;
        $allSelectedIds = collect();

        // Picking questions by difficulty as specified in settings
        // Expects settings like: ['easy' => 5, 'medium' => 10, 'hard' => 5]
        foreach ($settings as $difficulty => $count) {
            if ($count <= 0) continue;

            $ids = Question::where('teacher_id', $exam->teacher_id)
                ->where('grade_id', $exam->grade_id)
                ->where('difficulty', $difficulty)
                ->where('subject', $exam->subject)
                ->inRandomOrder()
                ->limit((int)$count)
                ->pluck('id');
            
            $allSelectedIds = $allSelectedIds->merge($ids);
        }

        return $allSelectedIds->shuffle()->values()->all();
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
