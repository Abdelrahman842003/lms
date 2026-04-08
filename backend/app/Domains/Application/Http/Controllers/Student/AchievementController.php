<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Auth\Models\Student;
use App\Domains\Gamification\Models\StudentLevelHistory;
use App\Domains\Gamification\Services\LevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AchievementController extends Controller
{
    public function __construct(
        private LevelService $levelService
    ) {}

    /**
     * Get student's achievements: current level, progress, history, certificates.
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();
        if (!$student instanceof Student) {
            return $this->errorResponse('غير مصرح بالوصول لهذه البيانات', null, 403);
        }

        $validated = $request->validate([
            'teacher_id' => ['nullable', 'string', 'uuid'],
        ]);

        $teacherId = $validated['teacher_id'] ?? null;

        try {
            $achievements = $this->levelService->getStudentAchievements($student, $teacherId);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch student achievements', [
                'student_id' => $student->id,
                'teacher_id' => $teacherId,
                'error' => $e->getMessage(),
            ]);

            return $this->errorResponse('تعذر تحميل الإنجازات حالياً', null, 500);
        }

        return $this->successResponse($achievements);
    }

    /**
     * Download a level-up certificate PDF.
     */
    public function downloadCertificate(Request $request, string $historyId): JsonResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $student = $request->user();
        $teacherName = $request->query('teacher_name');

        /** @var StudentLevelHistory $history */
        $history = StudentLevelHistory::query()
            ->where('id', $historyId)
            ->where('student_id', $student->id)
            ->firstOrFail();

        if (!$history->hasCertificate()) {
            // Try to generate certificate if it doesn't exist
            try {
                $certificatePath = $this->levelService->generateCertificate($history, $teacherName);
                $history->update(['certificate_path' => $certificatePath]);
            } catch (\Throwable $e) {
                return $this->errorResponse('الشهادة غير متاحة حالياً', null, 404);
            }
        } else if ($teacherName) {
            // Re-generate certificate with teacher name
            try {
                $certificatePath = $this->levelService->generateCertificate($history, $teacherName);
            } catch (\Throwable $e) {}
        }

        $filePath = $this->levelService->getCertificatePath($history);

        if (!$filePath || !file_exists($filePath)) {
            return $this->errorResponse('الشهادة غير موجودة', null, 404);
        }

        $levelName = $history->level?->name ?? 'شهادة';

        return response()->download($filePath, "شهادة_{$levelName}.pdf", [
            'Content-Type' => 'application/pdf',
        ]);
    }
}
