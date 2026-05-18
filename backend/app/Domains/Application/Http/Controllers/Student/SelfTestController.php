<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Services\Exams\DynamicExamGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class SelfTestController extends Controller
{
    public function __construct(
        private DynamicExamGenerator $examGenerator
    ) {}

    /**
     * Get available question counts by difficulty for a teacher
     */
    public function availableCounts(Request $request): JsonResponse
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
        ]);

        $teacherId = $request->input('teacher_id');

        $counts = \App\Domains\Exams\Models\Question::where('teacher_id', $teacherId)
            ->select('difficulty', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('difficulty')
            ->get()
            ->pluck('count', 'difficulty');

        return $this->successResponse([
            'easy' => $counts->get('easy', 0),
            'medium' => $counts->get('medium', 0),
            'hard' => $counts->get('hard', 0),
            'total' => $counts->sum(),
        ]);
    }

    /**
     * Get self-test history for the student and teacher
     */
    public function history(Request $request): JsonResponse
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
        ]);

        $student = $request->user();
        $teacherId = $request->input('teacher_id');

        $attempts = \App\Domains\Exams\Models\ExamAttempt::where('student_id', $student->id)
            ->whereHas('exam', function ($query) use ($teacherId) {
                $query->where('teacher_id', $teacherId)
                    ->where('type', 'self_test');
            })
            ->with(['result', 'exam'])
            ->latest()
            ->paginate($request->input('per_page', 10));

        return $this->successResponse(
            \App\Domains\Application\Http\Resources\Student\SelfTestHistoryResource::collection($attempts)->response()->getData(true)
        );
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function start(Request $request): JsonResponse
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'easy_count' => 'required|integer|min:0',
            'medium_count' => 'required|integer|min:0',
            'hard_count' => 'required|integer|min:0',
        ]);

        $student = $request->user();
        $teacherId = $request->input('teacher_id');

        $totalRequested = $request->input('easy_count') + $request->input('medium_count') + $request->input('hard_count');
        if ($totalRequested <= 0) {
            return $this->errorResponse('يجب طلب سؤال واحد على الأقل.', 422);
        }
        if ($totalRequested > 50) {
            return $this->errorResponse('الحد الأقصى لأسئلة الاختبار هو 50 سؤال.', 422);
        }

        // Rate limiting to prevent spam (e.g. 5 attempts per day per teacher per student)
        $rateLimitKey = 'self_test_' . $student->id . '_' . $teacherId;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return $this->errorResponse("لقد تجاوزت الحد المسموح به. يرجى المحاولة بعد {$seconds} ثانية.", 429);
        }

        $config = [
            'easy' => $request->input('easy_count'),
            'medium' => $request->input('medium_count'),
            'hard' => $request->input('hard_count'),
        ];

        try {
            $masterExam = $this->examGenerator->getOrCreateSelfTestMasterExam($teacherId);
            
            // Set dynamic config for this specific generation call without saving to the master exam
            $masterExam->dynamic_settings = $config;

            $attempt = $this->examGenerator->generateAttempt($masterExam, $student->id);

            RateLimiter::hit($rateLimitKey, 86400); // 24 hours decay

            return $this->successResponse([
                'attempt_id' => $attempt->id,
                'total_questions' => count($attempt->questions_order),
                'message' => 'تم إنشاء الاختبار بنجاح.',
            ], 'تم الإنشاء بنجاح', 201);

        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
