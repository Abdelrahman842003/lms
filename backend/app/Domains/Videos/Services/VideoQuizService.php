<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Gamification\Services\PointService;
use App\Domains\Support\Services\CacheService;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoQuiz;
use App\Domains\Videos\Models\VideoQuizAttempt;
use App\Domains\Videos\Models\VideoQuizQuestion;
use App\Domains\Videos\Models\VideoWatchProgress;
use App\Domains\Videos\Enums\VideoWatchStatus;
use Illuminate\Support\Facades\DB;

class VideoQuizService
{
    public function __construct(
        private readonly PointService $pointService,
    ) {}

    // ══════════════════════════════════════════════════════════════
    // Teacher CRUD
    // ══════════════════════════════════════════════════════════════

    /**
     * إنشاء تدريب جديد مع أسئلته لفيديو معين
     *
     * @param array{title:string, passing_score:int, is_required:bool, is_active:bool, questions: array} $data
     */
    public function createQuiz(Video $video, Teacher $teacher, array $data): VideoQuiz
    {
        return DB::transaction(function () use ($video, $teacher, $data): VideoQuiz {
            // فيديو واحد = تدريب واحد فقط
            if ($video->quiz()->exists()) {
                throw new \RuntimeException('هذا الفيديو لديه تدريب بالفعل. قم بتعديله أو احذفه أولاً.');
            }

            $quiz = VideoQuiz::create([
                'video_id'     => $video->id,
                'teacher_id'   => $teacher->id,
                'title'        => $data['title'],
                'passing_score'=> $data['passing_score'] ?? 60,
                'is_required'  => $data['is_required'] ?? true,
                'is_active'    => $data['is_active'] ?? true,
            ]);

            $this->syncQuestions($quiz, $data['questions'] ?? []);

            return $quiz->load('questions');
        });
    }

    /**
     * تعديل التدريب وأسئلته
     *
     * @param array{title?:string, passing_score?:int, is_required?:bool, is_active?:bool, questions?:array} $data
     */
    public function updateQuiz(VideoQuiz $quiz, array $data): VideoQuiz
    {
        return DB::transaction(function () use ($quiz, $data): VideoQuiz {
            $quiz->update(array_filter([
                'title'        => $data['title'] ?? null,
                'passing_score'=> $data['passing_score'] ?? null,
                'is_required'  => isset($data['is_required']) ? $data['is_required'] : null,
                'is_active'    => isset($data['is_active']) ? $data['is_active'] : null,
            ], fn($v) => $v !== null));

            if (isset($data['questions'])) {
                $this->syncQuestions($quiz, $data['questions']);
            }

            return $quiz->fresh(['questions']);
        });
    }

    /**
     * حذف التدريب
     */
    public function deleteQuiz(VideoQuiz $quiz): void
    {
        $quiz->delete();
    }

    // ══════════════════════════════════════════════════════════════
    // Student: Submit Attempt
    // ══════════════════════════════════════════════════════════════

    /**
     * تسليم محاولة حل التدريب من الطالب
     *
     * يتطلب أن يكون الطالب قد شاهد الفيديو (watched_pending_quiz أو completed)
     *
     * @param array<string, string> $answers ['question_id' => 'student_answer']
     * @return array{attempt: VideoQuizAttempt, points_earned: int, passed: bool, correct: int, total: int, percentage: float}
     */
    public function submitAttempt(VideoQuiz $quiz, Student $student, array $answers): array
    {
        // تحقق أن الطالب شاهد الفيديو أولاً
        $progress = VideoWatchProgress::where('video_id', $quiz->video_id)
            ->where('student_id', $student->id)
            ->first();

        if (
            !$progress ||
            !in_array($progress->status, [
                VideoWatchStatus::WATCHED_PENDING_QUIZ,
                VideoWatchStatus::COMPLETED,
            ])
        ) {
            throw new \RuntimeException('يجب مشاهدة الفيديو كاملاً أولاً قبل حل التدريب.');
        }

        // منع إعادة الاختبار بعد النجاح
        if ($progress->quiz_passed_at !== null) {
            throw new \RuntimeException('لقد اجتزت هذا الاختبار بالفعل ولا يمكن إعادته.');
        }

        return DB::transaction(function () use ($quiz, $student, $answers, $progress): array {
            $questions = VideoQuizQuestion::where('video_quiz_id', $quiz->id)
                ->get()
                ->keyBy('id');

            $correctCount = 0;
            $answersSnapshot = [];

            foreach ($answers as $questionId => $studentAnswer) {
                $question = $questions->get($questionId);
                if (!$question) {
                    continue;
                }
                $isCorrect = trim((string) $studentAnswer) === trim((string) $question->correct_answer);
                if ($isCorrect) {
                    $correctCount++;
                }
                $answersSnapshot[$questionId] = [
                    'answer'     => $studentAnswer,
                    'is_correct' => $isCorrect,
                ];
            }

            $totalCount  = $questions->count();
            $percentage  = $totalCount > 0 ? round(($correctCount / $totalCount) * 100, 2) : 0;
            $passed      = $percentage >= $quiz->passing_score;
            $status      = $passed ? 'passed' : 'failed';

            // تسجيل المحاولة
            $attempt = VideoQuizAttempt::create([
                'video_quiz_id' => $quiz->id,
                'student_id'    => $student->id,
                'correct_count' => $correctCount,
                'total_count'   => $totalCount,
                'percentage'    => $percentage,
                'status'        => $status,
                'answers'       => $answersSnapshot,
                'completed_at'  => now(),
            ]);

            $pointsEarned = 0;
            $shouldAwardPoints = $passed && $progress->quiz_passed_at === null;

            // منح النقاط فقط في أول مرة ينجح فيها
            if ($shouldAwardPoints) {
                // تحديث progress: اجتاز التدريب
                $progress->update([
                    'quiz_passed_at' => now(),
                    'status'         => VideoWatchStatus::COMPLETED,
                    'completed_at'   => $progress->completed_at ?? now(),
                ]);
            } elseif ($passed && $progress->status !== VideoWatchStatus::COMPLETED) {
                // نجح مرة أخرى لكن النقاط أُعطيت من قبل، فقط تأكد من الـ status
                $progress->update(['status' => VideoWatchStatus::COMPLETED]);
            }

            return [
                'attempt'          => $attempt,
                'points_earned'    => $pointsEarned,
                'passed'           => $passed,
                'correct'          => $correctCount,
                'total'            => $totalCount,
                'percentage'       => (float) $percentage,
                'should_award'     => $shouldAwardPoints,
            ];
        });

        // منح النقاط خارج الـ transaction لتجنب rollback عند أي خطأ في الـ gamification
        if ($result['should_award'] ?? false) {
            $progress = $progress->fresh();
            try {
                $result['points_earned'] = $this->awardVideoCompletionPoints(
                    $student,
                    $quiz,
                    $progress,
                    (float) $result['percentage']
                );
            } catch (\Throwable) {
                // فشل منح النقاط لا يمنع تسجيل الاجتياز
                $result['points_earned'] = 0;
            }
        }

        unset($result['should_award']);
        return $result;

    // ══════════════════════════════════════════════════════════════
    // Queries
    // ══════════════════════════════════════════════════════════════

    /**
     * تفاصيل التدريب للطالب (بدون الإجابات الصحيحة)
     */
    public function getQuizForStudent(VideoQuiz $quiz): array
    {
        return [
            'id'            => $quiz->id,
            'title'         => $quiz->title,
            'passing_score' => $quiz->passing_score,
            'is_required'   => $quiz->is_required,
            'is_active'     => $quiz->is_active,
            'questions'     => $quiz->questions->map(fn($q) => [
                'id'      => $q->id,
                'text'    => $q->text,
                'options' => $q->options,
                // لا نُرسل correct_answer للطالب
            ])->values(),
        ];
    }

    /**
     * آخر نتائج محاولات الطالب على هذا التدريب
     */
    public function getStudentAttempts(VideoQuiz $quiz, Student $student): \Illuminate\Database\Eloquent\Collection
    {
        return VideoQuizAttempt::where('video_quiz_id', $quiz->id)
            ->where('student_id', $student->id)
            ->orderByDesc('created_at')
            ->get();
    }

    // ══════════════════════════════════════════════════════════════
    // Private Helpers
    // ══════════════════════════════════════════════════════════════

    /**
     * مزامنة الأسئلة: حذف القديمة وإضافة الجديدة
     *
     * @param array<int, array{text:string, options:array, correct_answer:string, sort_order?:int}> $questions
     */
    private function syncQuestions(VideoQuiz $quiz, array $questions): void
    {
        $quiz->questions()->delete();

        foreach ($questions as $index => $q) {
            VideoQuizQuestion::create([
                'video_quiz_id' => $quiz->id,
                'text'          => $q['text'],
                'options'       => $q['options'],
                'correct_answer'=> $q['correct_answer'],
                'sort_order'    => $q['sort_order'] ?? $index,
            ]);
        }
    }

    /**
     * منح نقاط إتمام الفيديو + اجتياز التدريب في أول مرة
     * (يُستدعى مرة واحدة فقط عند quiz_passed_at === null)
     */
    private function awardVideoCompletionPoints(
        Student $student,
        VideoQuiz $quiz,
        VideoWatchProgress $progress,
        float $quizPercentage
    ): int {
        // تجنب ازدواجية النقاط (لو video_points_awarded = true لا نمنح مجدداً)
        if ($progress->video_points_awarded) {
            return 0;
        }

        $video     = $quiz->video;
        $teacherId = $quiz->teacher_id;
        $settings  = CacheService::getGamificationSettings(
            $teacherId,
            fn() => GamificationSetting::getOrCreate($teacherId)
        );

        if (!$settings->is_enabled) {
            return 0;
        }

        $totalPoints = 0;

        // 1. نقاط مشاهدة الفيديو
        if ($settings->video_watch_points > 0) {
            $this->pointService->awardRaw(
                $student,
                $teacherId,
                $settings->video_watch_points,
                PointTransaction::TYPE_VIDEO_WATCHED,
                Video::class,
                $video->id,
                "مشاهدة فيديو: {$video->title}"
            );
            $totalPoints += $settings->video_watch_points;
        }

        // 2. نقاط اجتياز التدريب (بناءً على النسبة)
        $quizPoints = $settings->calculateVideoQuizPoints($quizPercentage);
        if ($quizPoints > 0) {
            $this->pointService->awardRaw(
                $student,
                $teacherId,
                $quizPoints,
                PointTransaction::TYPE_VIDEO_QUIZ_PASSED,
                VideoQuiz::class,
                $quiz->id,
                "تدريب فيديو: {$video->title} - {$quizPercentage}%"
            );
            $totalPoints += $quizPoints;
        }

        // 3. بونص الدرجة الكاملة (100%)
        if ($quizPercentage >= 100 && $settings->video_quiz_perfect_bonus > 0) {
            $this->pointService->awardRaw(
                $student,
                $teacherId,
                $settings->video_quiz_perfect_bonus,
                PointTransaction::TYPE_VIDEO_QUIZ_PERFECT,
                VideoQuiz::class,
                $quiz->id,
                "تدريب فيديو بدرجة كاملة: {$video->title}"
            );
            $totalPoints += $settings->video_quiz_perfect_bonus;
        }

        // 4. بونص أول مشاهد (لا يوجد طالب آخر أكمل قبله)
        if ($settings->video_first_watch_bonus > 0) {
            $alreadyCompleted = VideoWatchProgress::where('video_id', $video->id)
                ->where('student_id', '!=', $student->id)
                ->whereNotNull('quiz_passed_at')
                ->exists();

            if (!$alreadyCompleted) {
                $this->pointService->awardRaw(
                    $student,
                    $teacherId,
                    $settings->video_first_watch_bonus,
                    PointTransaction::TYPE_VIDEO_FIRST_WATCH,
                    Video::class,
                    $video->id,
                    "أول مشاهد للفيديو: {$video->title}"
                );
                $totalPoints += $settings->video_first_watch_bonus;
            }
        }

        // تأشير أن النقاط مُنحت
        $progress->update(['video_points_awarded' => true]);

        return $totalPoints;
    }
}
