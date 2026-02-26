<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Services\Student\MistakesService;
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

        Log::debug('Fetching mistakes for student', [
            'student_id' => $student->id,
            'teacher_id' => $request->teacher_id,
        ]);

        $mistakes = $this->mistakesService->getMistakes(
            $student->id,
            $request->teacher_id
        );

        $stats = $this->mistakesService->getStats($student->id, $request->teacher_id);

        return $this->successResponse([
            'mistakes' => $mistakes,
            'stats' => $stats,
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
            return $this->errorResponse('السؤال غير موجود', 404);
        }

        return $this->successResponse(null, 'تم تسجيل السؤال كـ "فهمتها" ✓');
    }
}
