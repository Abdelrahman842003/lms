<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\MistakesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MistakesController extends Controller
{
    public function __construct(
        private MistakesService $mistakesService
    ) {}

    /**
     * Get student's mistakes for a teacher
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'teacher_id' => 'required|uuid|exists:teachers,id',
            // include_mastered is handled by $request->boolean() which accepts any truthy/falsy value
        ]);

        $student = $request->user();
        $includeMastered = $request->boolean('include_mastered', false);

        $mistakes = $this->mistakesService->getMistakes(
            $student->id,
            $request->teacher_id,
            $includeMastered
        );

        $stats = $this->mistakesService->getStats($student->id, $request->teacher_id);

        return response()->json([
            'success' => true,
            'data' => [
                'mistakes' => $mistakes,
                'stats' => $stats,
            ],
        ]);
    }

    /**
     * Mark a mistake as mastered
     */
    public function markAsMastered(Request $request, string $id): JsonResponse
    {
        $student = $request->user();
        
        $success = $this->mistakesService->markAsMastered($id, $student->id);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'السؤال غير موجود',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل السؤال كـ "فهمتها" ✓',
        ]);
    }

    /**
     * Get review quiz
     */
    public function quiz(Request $request): JsonResponse
    {
        $request->validate([
            'teacher_id' => 'required|uuid|exists:teachers,id',
            'limit' => 'sometimes|integer|min:5|max:20',
        ]);

        $student = $request->user();
        $limit = $request->input('limit', 10);

        $quiz = $this->mistakesService->getReviewQuiz(
            $student->id,
            $request->teacher_id,
            $limit
        );

        return response()->json([
            'success' => true,
            'data' => $quiz,
        ]);
    }

    /**
     * Submit answer in review quiz
     */
    public function submitQuizAnswer(Request $request, string $failedQuestionId): JsonResponse
    {
        $request->validate([
            'answer' => 'required|string',
        ]);

        $result = $this->mistakesService->checkReviewAnswer(
            $failedQuestionId,
            $request->answer
        );

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }
}
