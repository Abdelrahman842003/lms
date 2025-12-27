<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\MistakesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;

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
        ]);

        $student = $request->user();

        Log::info('Fetching mistakes for student', [
            'student_id' => $student->id,
            'teacher_id' => $request->teacher_id,
        ]);

        $mistakes = $this->mistakesService->getMistakes(
            $student->id,
            $request->teacher_id
        );

        Log::info('Mistakes fetched', [
            'count' => $mistakes->count(),
            'student_id' => $student->id
        ]);

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
            'data' => [
                'success' => true,
                'message' => 'تم تسجيل السؤال كـ "فهمتها" ✓',
            ],
        ]);
    }
}
