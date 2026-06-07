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
        if (!$request->has('teacher_profile_id') && $request->has('teacher_id')) {
            $request->merge(['teacher_profile_id' => $request->input('teacher_id')]);
        }

        $request->validate([
            'teacher_profile_id' => [
                'required',
                function ($attribute, $value, $fail) {
                    $exists = \App\Domains\Auth\Models\TeacherProfile::where('id', $value)
                        ->orWhere('uuid', $value)
                        ->exists();
                    if (!$exists) {
                        $fail('المدرس غير موجود');
                    }
                }
            ],
        ]);

        $student = $request->user();
        $teacherProfileInput = $request->input('teacher_profile_id');
        $teacherProfile = \App\Domains\Auth\Models\TeacherProfile::where('id', $teacherProfileInput)
            ->orWhere('uuid', $teacherProfileInput)
            ->first();
        $teacherProfileId = $teacherProfile->id;

        Log::debug('Fetching mistakes for student', [
            'student_id' => $student->id,
            'teacher_profile_id' => $teacherProfileId,
        ]);

        $mistakes = $this->mistakesService->getMistakes(
            $student->id,
            $teacherProfileId
        );

        $stats = $this->mistakesService->getStats($student->id, $teacherProfileId);

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
