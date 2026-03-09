<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Student\SubmitVideoQuizRequest;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Services\VideoQuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class StudentVideoQuizController extends Controller
{
    public function __construct(
        private readonly VideoQuizService $quizService,
    ) {}

    /**
     * GET /student/videos/{video}/quiz
     * جلب أسئلة التدريب (بدون الإجابات الصحيحة)
     */
    public function show(Video $video): JsonResponse
    {
        $quiz = $video->quiz()
            ->where('is_active', true)
            ->with('questions')
            ->first();

        if (!$quiz) {
            return response()->json(['quiz' => null]);
        }

        $student   = Auth::user();
        $attempts  = $this->quizService->getStudentAttempts($quiz, $student);
        $bestScore = $attempts->max('percentage') ?? 0;
        $passed    = $attempts->where('status', 'passed')->isNotEmpty();

        $quizData = $this->quizService->getQuizForStudent($quiz);
        $quizData['my_status'] = [
            'passed'          => $passed,
            'attempts_count'  => $attempts->count(),
            'best_score'      => (float) $bestScore,
            'last_attempt'    => $attempts->first(),
        ];

        return response()->json(['quiz' => $quizData]);
    }

    /**
     * POST /student/videos/{video}/quiz/submit
     * تسليم إجابات التدريب
     */
    public function submit(SubmitVideoQuizRequest $request, Video $video): JsonResponse
    {
        $quiz = $video->quiz()
            ->where('is_active', true)
            ->first();

        if (!$quiz) {
            return $this->errorResponse('لا يوجد تدريب لهذا الفيديو', 404);
        }

        $student = Auth::user();

        try {
            $result = $this->quizService->submitAttempt($quiz, $student, $request->input('answers', []));
        } catch (\RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        $message = $result['passed']
            ? 'أحسنت! اجتزت التدريب بنجاح 🎉'
            : 'لم تجتز التدريب، يمكنك المحاولة مرة أخرى';

        return $this->successResponse([
            'attempt'       => $result['attempt'],
            'passed'        => $result['passed'],
            'correct'       => $result['correct'],
            'total'         => $result['total'],
            'percentage'    => $result['percentage'],
            'points_earned' => $result['points_earned'],
            'passing_score' => $quiz->passing_score,
        ], $message);
    }

    /**
     * GET /student/videos/{video}/quiz/attempts
     * سجل محاولات الطالب
     */
    public function attempts(Video $video): JsonResponse
    {
        $quiz = $video->quiz()->where('is_active', true)->first();

        if (!$quiz) {
            return $this->errorResponse('لا يوجد تدريب لهذا الفيديو', 404);
        }

        $student  = Auth::user();
        $attempts = $this->quizService->getStudentAttempts($quiz, $student);

        return $this->successResponse([
            'attempts' => $attempts->map(fn($a) => [
                'id'            => $a->id,
                'correct_count' => $a->correct_count,
                'total_count'   => $a->total_count,
                'percentage'    => (float) $a->percentage,
                'status'        => $a->status,
                'completed_at'  => $a->completed_at,
            ]),
            'best_score' => (float) ($attempts->max('percentage') ?? 0),
            'passed'     => $attempts->where('status', 'passed')->isNotEmpty(),
        ]);
    }
}
