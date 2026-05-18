<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Exams;

use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamAttempt;
use App\Domains\Exams\Models\Question;
use App\Domains\Exams\Models\StudentAnswer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DynamicExamGenerator
{
    public function __construct(
        private QuestionSelectionService $selectionService
    ) {}

    /**
     * Generates a new exam attempt for a dynamic or self_test exam.
     */
    public function generateAttempt(Exam $exam, string $studentId): ExamAttempt
    {
        return DB::transaction(function () use ($exam, $studentId) {
            $config = $exam->dynamic_settings ?? [];
            if (empty($config)) {
                throw new \Exception("إعدادات الامتحان الديناميكي غير صالحة.");
            }

            // 1. Select Questions dynamically
            $questions = $this->selectionService->selectForStudent($exam->teacher_id, $studentId, $config);

            if ($questions->isEmpty()) {
                throw new \Exception("لا يمكن توليد الامتحان لعدم وجود أسئلة متاحة.");
            }

            // Mix the questions order randomly for this attempt
            $questions = $questions->shuffle();

            // 2. Create the Exam Attempt
            $attempt = ExamAttempt::create([
                'exam_id' => $exam->id,
                'student_id' => $studentId,
                'started_at' => now(),
                'status' => 'in_progress',
                'questions_order' => $questions->pluck('id')->toArray(),
                'current_question_index' => 0,
            ]);

            // 3. Create StudentAnswer stubs with Snapshots (SnapshotService logic inline)
            $stubs = [];
            $now = now();
            foreach ($questions as $question) {
                // Remove unwanted dynamic attributes if any and capture the exact state
                $snapshot = [
                    'text' => $question->text,
                    'type' => $question->type->value ?? $question->type,
                    'difficulty' => $question->difficulty,
                    'options' => $question->options,
                    'correct_answer' => $question->correct_answer,
                ];

                $stubs[] = [
                    'id' => Str::uuid()->toString(),
                    'exam_attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                    'question_snapshot' => json_encode($snapshot),
                    'answer' => null,
                    'is_correct' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Bulk insert stubs for performance
            StudentAnswer::insert($stubs);

            return $attempt;
        });
    }

    /**
     * Helper to retrieve or create the master 'Self Test' exam for a teacher
     */
    public function getOrCreateSelfTestMasterExam(string $teacherId): Exam
    {
        $exam = Exam::where('teacher_id', $teacherId)
            ->where('type', 'self_test')
            ->first();

        if (!$exam) {
            $exam = Exam::create([
                'teacher_id' => $teacherId,
                'title' => 'اختبر نفسك',
                'type' => 'self_test',
                'subject' => 'تدريب عام',
                'date' => now(),
                'duration' => 60, // Arbitrary, self-tests usually ignore strict overall duration
                'max_score' => 100, // Calculated dynamically later based on answers
                'actual_question_count' => 0, // Dynamic
                'is_active' => true, // Always active to receive attempts
                'dynamic_settings' => [],
            ]);
        }

        return $exam;
    }
}
