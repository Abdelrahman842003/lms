<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Scan\ScanRequest;
use App\Services\Teacher\ScanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScanController extends Controller
{
    public function __construct(
        private ScanService $scanService
    ) {}

    /**
     * Handle check-in scan
     */
    public function checkin(ScanRequest $request): JsonResponse
    {
        $teacher = $request->user();
        $validated = $request->validated();

        try {
            $result = $this->scanService->checkin($teacher, $validated['qr_code']);

            return $this->successResponse([
                'log' => $result['log'],
                'academy' => [
                    'id' => $result['academy']->id,
                    'name' => $result['academy']->name,
                ],
                'message' => 'تم تسجيل الحضور بنجاح',
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Handle check-out scan
     */
    public function checkout(ScanRequest $request): JsonResponse
    {
        $teacher = $request->user();
        $validated = $request->validated();

        try {
            $result = $this->scanService->checkout($teacher, $validated['qr_code']);

            return $this->successResponse([
                'log' => $result['log'],
                'duration' => $result['log']->duration_formatted,
                'academy' => [
                    'id' => $result['academy']->id,
                    'name' => $result['academy']->name,
                ],
                'message' => 'تم تسجيل الانصراف بنجاح',
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get today's attendance status
     */
    public function todayStatus(Request $request): JsonResponse
    {
        $teacher = $request->user();
        $logs = $this->scanService->getTodayStatus($teacher);

        return $this->successResponse(['logs' => $logs]);
    }
}
