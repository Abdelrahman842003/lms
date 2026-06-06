<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Exams;

use App\Domains\Exams\Models\Question;
use App\Domains\Exams\Models\StudentAnswer;
use Illuminate\Support\Collection;

class QuestionSelectionService
{
    /**
     * Selects questions dynamically based on configured counts per difficulty.
     * Ensures we avoid questions the student has seen recently and favors least used.
     *
     * @param string $teacherProfileId
     * @param string $studentId
     * @param array $config e.g. ['easy' => 5, 'medium' => 3, 'hard' => 2]
     * @param string|null $gradeId
     * @return Collection Collection of Question models
     * @throws \Exception If not enough questions available
     */
    public function selectForStudent(string $teacherProfileId, string $studentId, array $config, ?string $gradeId = null): Collection
    {
        $selectedQuestions = collect();

        // Find IDs of questions the student has previously answered to avoid repeats
        $previouslyAnsweredIds = StudentAnswer::whereHas('attempt.exam', function ($q) use ($teacherProfileId) {
            $q->where('teacher_profile_id', $teacherProfileId);
        })
        ->whereHas('attempt', function ($q) use ($studentId) {
            $q->where('student_id', $studentId);
        })
        ->pluck('question_id')
        ->toArray();

        foreach ($config as $difficulty => $count) {
            if ($count <= 0) {
                continue;
            }

            // Query bank for this teacher & difficulty
            $query = Question::where('teacher_profile_id', $teacherProfileId)
                ->where('difficulty', $difficulty);

            if ($gradeId) {
                $query->where('grade_id', $gradeId);
            }

            // Fetch available count without exclusions first to check total limits
            $totalAvailable = $query->count();
            if ($totalAvailable < $count) {
                throw new \Exception("لا يوجد عدد كافٍ من الأسئلة في بنك الأسئلة لمستوى الصعوبة: {$difficulty}. المطلوب {$count} والمتاح {$totalAvailable}.");
            }

            // Prioritize questions the student hasn't seen
            $unseenQuestions = (clone $query)->whereNotIn('id', $previouslyAnsweredIds)
                ->orderBy('usage_count', 'asc') // Favor least used
                ->inRandomOrder() // Add some randomness among equals
                ->take($count)
                ->get();

            $selectedQuestions = $selectedQuestions->concat($unseenQuestions);

            // If we still need more questions (student has seen almost all of them)
            $remainingCount = $count - $unseenQuestions->count();
            if ($remainingCount > 0) {
                $seenQuestionsToReuse = (clone $query)->whereIn('id', $previouslyAnsweredIds)
                    ->orderBy('usage_count', 'asc')
                    ->inRandomOrder()
                    ->take($remainingCount)
                    ->get();
                    
                $selectedQuestions = $selectedQuestions->concat($seenQuestionsToReuse);
            }
        }

        return $selectedQuestions;
    }
}
