<?php

namespace App\Services\Student;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamResult;
use App\Models\Question;
use App\Models\Student;
use App\Models\StudentAnswer;
use App\Notifications\ExamResultNotification;
use App\Services\MistakesService;
use App\Services\PointService;
use Illuminate\Support\Facades\DB;

class StudentExamService
{
    public function __construct(
        private PointService $pointService,
        private MistakesService $mistakesService
    ) {}
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
                
                \Log::info('Exam Attempt Check', [
                    'attempt_id' => $existingAttempt->id,
                    'questions_order_count' => count($existingAttempt->questions_order),
                    'found_questions_count' => $questionsCount,
                    'questions_order' => $existingAttempt->questions_order
                ]);

                if ($questionsCount !== count($existingAttempt->questions_order)) {
                    // Exam was modified, delete invalid attempt and start over
                    \Log::info('Deleting invalid attempt', ['attempt_id' => $existingAttempt->id]);
                    $existingAttempt->delete();
                    $existingAttempt = null;
                } else {
                    // Return existing attempt
                    return $this->getAttemptData($existingAttempt);
                }
            }
            
            if ($existingAttempt) {
                throw new \Exception('لقد قمت بأداء هذا الامتحان مسبقاً');
            }
        }

        // Select random questions
        $allQuestionIds = $exam->questions()->pluck('id')->toArray();
        $questionsCount = min($exam->actual_question_count, count($allQuestionIds));
        
        if ($questionsCount === 0) {
            throw new \Exception('لا توجد أسئلة في هذا الامتحان');
        }

        // Shuffle and select questions
        shuffle($allQuestionIds);
        $selectedQuestionIds = array_slice($allQuestionIds, 0, $questionsCount);

        // Create attempt
        $attempt = ExamAttempt::create([
            'exam_id' => $exam->id,
            'student_id' => $student->id,
            'started_at' => now(),
            'questions_order' => $selectedQuestionIds,
            'current_question_index' => 0,
            'status' => 'in_progress',
        ]);

        return $this->getAttemptData($attempt);
    }

    /**
     * Submit an answer for the current question
     */
    public function submitAnswer(ExamAttempt $attempt, string $answer): array
    {
        if ($attempt->status !== 'in_progress') {
            throw new \Exception('هذا الامتحان قد انتهى');
        }

        $currentQuestion = $attempt->getCurrentQuestion();
        if (!$currentQuestion) {
            throw new \Exception('لا يوجد سؤال حالي');
        }

        // Check if this question was already answered
        $existingAnswer = StudentAnswer::where('exam_attempt_id', $attempt->id)
            ->where('question_id', $currentQuestion->id)
            ->first();

        if ($existingAnswer) {
            throw new \Exception('تم الإجابة على هذا السؤال مسبقاً');
        }

        // Record the answer
        $isCorrect = $currentQuestion->correct_answer === $answer;
        StudentAnswer::create([
            'exam_attempt_id' => $attempt->id,
            'question_id' => $currentQuestion->id,
            'answer' => $answer,
            'is_correct' => $isCorrect,
            'answered_at' => now(),
        ]);

        // Track wrong answer for Smart Mistakes Notebook
        if (!$isCorrect) {
            try {
                $this->mistakesService->trackWrongAnswer(
                    $attempt->student,
                    $currentQuestion,
                    $attempt->exam,
                    $answer
                );
            } catch (\Exception $e) {
                \Log::error('Failed to track wrong answer: ' . $e->getMessage());
            }
        }

        // Move to next question
        $attempt->current_question_index += 1;
        $attempt->save();

        // Check if exam is complete
        if ($attempt->isComplete()) {
            return $this->completeExam($attempt);
        }

        return $this->getAttemptData($attempt);
    }

    /**
     * Skip the current question (time expired)
     */
    public function skipQuestion(ExamAttempt $attempt): array
    {
        if ($attempt->status !== 'in_progress') {
            throw new \Exception('هذا الامتحان قد انتهى');
        }

        $currentQuestion = $attempt->getCurrentQuestion();
        if (!$currentQuestion) {
            throw new \Exception('لا يوجد سؤال حالي');
        }

        // Record empty answer
        StudentAnswer::create([
            'exam_attempt_id' => $attempt->id,
            'question_id' => $currentQuestion->id,
            'answer' => null,
            'is_correct' => false,
            'answered_at' => now(),
        ]);

        // Move to next question
        $attempt->current_question_index += 1;
        $attempt->save();

        // Check if exam is complete
        if ($attempt->isComplete()) {
            return $this->completeExam($attempt);
        }

        return $this->getAttemptData($attempt);
    }

    /**
     * Terminate exam due to violation
     */
    public function terminateExam(ExamAttempt $attempt, string $reason): array
    {
        if ($attempt->status !== 'in_progress') {
            throw new \Exception('هذا الامتحان قد انتهى');
        }

        $attempt->status = 'terminated';
        $attempt->terminated_reason = $reason;
        $attempt->completed_at = now();
        $attempt->save();

        return $this->createResult($attempt);
    }

    /**
     * Complete the exam normally
     */
    public function completeExam(ExamAttempt $attempt): array
    {
        $attempt->status = 'completed';
        $attempt->completed_at = now();
        $attempt->save();

        return $this->createResult($attempt);
    }

    /**
     * Create exam result and send notification
     */
    private function createResult(ExamAttempt $attempt): array
    {
        $exam = $attempt->exam;
        
        // Calculate score
        $correctAnswers = $attempt->answers()->where('is_correct', true)->count();
        $totalQuestions = count($attempt->questions_order);
        
        // Calculate score based on max_score
        $scorePerQuestion = $exam->max_score / $totalQuestions;
        $score = round($correctAnswers * $scorePerQuestion, 2);
        $percentage = $totalQuestions > 0 ? round(($correctAnswers / $totalQuestions) * 100, 2) : 0;

        // Create or update result
        $result = ExamResult::updateOrCreate(
            [
                'exam_id' => $exam->id,
                'student_id' => $attempt->student_id,
            ],
            [
                'score' => $score,
                'percentage' => $percentage,
                'attempt_id' => $attempt->id,
            ]
        );

        // Award gamification points
        $pointTransaction = null;
        try {
            $pointTransaction = $this->pointService->awardExamPoints($attempt->student, $result);
        } catch (\Exception $e) {
            \Log::error('Failed to award exam points: ' . $e->getMessage());
        }

        // Calculate progress
        $progress = $this->calculateProgress($attempt->student, $exam);

        // Send notification
        try {
            $attempt->student->notify(new ExamResultNotification($result, $progress));
        } catch (\Exception $e) {
            \Log::error('Failed to send exam result notification: ' . $e->getMessage());
        }

        return [
            'status' => 'completed',
            'result' => [
                'score' => $score,
                'max_score' => $exam->max_score,
                'percentage' => $percentage,
                'correct_answers' => $correctAnswers,
                'total_questions' => $totalQuestions,
                'terminated' => $attempt->status === 'terminated',
                'terminated_reason' => $attempt->terminated_reason,
                'points_earned' => $pointTransaction?->points ?? 0,
            ],
            'progress' => $progress,
        ];
    }

    /**
     * Calculate student's progress compared to previous exams
     */
    public function calculateProgress(Student $student, Exam $exam): array
    {
        // Get all completed exams for this teacher
        $teacherId = $exam->teacher_id;
        
        $previousResults = ExamResult::whereHas('exam', function ($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId);
        })
        ->where('student_id', $student->id)
        ->orderBy('created_at', 'desc')
        ->take(5)
        ->get();

        if ($previousResults->count() <= 1) {
            return [
                'has_previous' => false,
                'message' => 'هذا أول امتحان لك',
                'trend' => 'neutral',
            ];
        }

        $currentPercentage = $previousResults->first()->percentage;
        $previousAverage = $previousResults->skip(1)->avg('percentage');

        $difference = $currentPercentage - $previousAverage;
        $trend = $difference > 0 ? 'up' : ($difference < 0 ? 'down' : 'neutral');

        return [
            'has_previous' => true,
            'current_percentage' => $currentPercentage,
            'previous_average' => round($previousAverage, 2),
            'difference' => round(abs($difference), 2),
            'trend' => $trend,
            'message' => $this->getProgressMessage($trend, abs($difference)),
        ];
    }

    /**
     * Get human-readable progress message
     */
    private function getProgressMessage(string $trend, float $difference): string
    {
        if ($trend === 'up') {
            return "تحسن بنسبة {$difference}% عن المتوسط السابق";
        } elseif ($trend === 'down') {
            return "تراجع بنسبة {$difference}% عن المتوسط السابق";
        }
        return 'أداء مستقر';
    }

    /**
     * Get attempt data with current question
     */
    public function getAttemptData(ExamAttempt $attempt): array
    {
        $exam = $attempt->exam;
        $currentQuestion = $attempt->getCurrentQuestion();

        $response = [
            'status' => $attempt->status,
            'attempt_id' => $attempt->id,
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'subject' => $exam->subject,
                'time_per_question' => $exam->time_per_question,
            ],
            'progress' => [
                'current' => $attempt->current_question_index + 1,
                'total' => count($attempt->questions_order),
            ],
        ];

        if ($currentQuestion) {
            $options = $currentQuestion->options;
            shuffle($options); // Shuffle options for anti-cheating

            $response['question'] = [
                'id' => $currentQuestion->id,
                'text' => $currentQuestion->text,
                'options' => $options,
            ];
        }

        return $response;
    }

    /**
     * Get exam result for a student
     */
    public function getResult(Student $student, Exam $exam): ?array
    {
        $result = ExamResult::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();

        if (!$result) {
            return null;
        }

        $progress = $this->calculateProgress($student, $exam);

        return [
            'score' => $result->score,
            'max_score' => $exam->max_score,
            'percentage' => $result->percentage,
            'progress' => $progress,
        ];
    }
}
