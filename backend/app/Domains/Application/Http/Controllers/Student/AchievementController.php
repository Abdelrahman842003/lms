<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Gamification\Models\StudentLevelHistory;
use App\Domains\Gamification\Services\LevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $achievements = $this->levelService->getStudentAchievements($student);

        return $this->successResponse($achievements);
    }

    /**
     * Download a level-up certificate PDF.
     */
    public function downloadCertificate(Request $request, string $historyId): JsonResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $student = $request->user();

        $history = StudentLevelHistory::where('id', $historyId)
            ->where('student_id', $student->id)
            ->firstOrFail();

        if (!$history->hasCertificate()) {
            // Try to generate certificate if it doesn't exist
            try {
                $certificatePath = $this->levelService->generateCertificate($history);
                $history->update(['certificate_path' => $certificatePath]);
            } catch (\Throwable $e) {
                return $this->errorResponse('الشهادة غير متاحة حالياً', null, 404);
            }
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
