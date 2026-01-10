<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Services\Academy\AttendanceService;
use App\Http\Requests\Academy\MarkAbsentRequest;
use App\Http\Requests\Academy\UpdateAttendanceNotesRequest;
use App\DTOs\Academy\AttendanceData;
use App\Http\Resources\Academy\AttendanceLogResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AttendanceController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {}

    /**
     * Get attendance logs with filtering
     */
    public function index(Request $request): JsonResponse
    {
        $academy = $request->user();

        $perPage = (int) $request->input('per_page', 15);
        $teacherId = $request->input('teacher_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $status = $request->input('status');

        $logs = $this->attendanceService->getAttendanceLogs(
            $academy,
            $perPage,
            $teacherId,
            $dateFrom,
            $dateTo,
            $status
        );

        return $this->successResponse(AttendanceLogResource::collection($logs));
    }

    /**
     * Get today's attendance
     */
    public function todayAttendance(Request $request): JsonResponse
    {
        $academy = $request->user();

        $logs = $this->attendanceService->getTodayAttendance($academy);

        return $this->successResponse(AttendanceLogResource::collection($logs));
    }

    /**
     * Mark teacher as absent
     */
    public function markAbsent(MarkAbsentRequest $request): JsonResponse
    {
        $academy = $request->user();

        try {
            $data = AttendanceData::fromRequest($request);
            $log = $this->attendanceService->markAbsent($academy, $data);

            return $this->successResponse(
                new AttendanceLogResource($log),
                'تم تسجيل الغياب بنجاح'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Update notes for attendance log
     */
    public function updateNotes(UpdateAttendanceNotesRequest $request, string $logId): JsonResponse
    {
        $academy = $request->user();

        try {
            $log = $this->attendanceService->updateNotes($logId, $request->validated('notes'));

            return $this->successResponse(
                new AttendanceLogResource($log),
                'تم تحديث الملاحظات بنجاح'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get attendance statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $academy = $request->user();

        $validated = $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date',
        ]);

        $stats = $this->attendanceService->getStats(
            $academy,
            $validated['date_from'],
            $validated['date_to']
        );

        return $this->successResponse($stats);
    }
}
