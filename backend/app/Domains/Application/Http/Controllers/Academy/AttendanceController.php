<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Lectures\DTOs\AttendanceData;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\MarkAbsentRequest;
use App\Domains\Application\Http\Requests\Academy\UpdateAttendanceNotesRequest;
use App\Domains\Application\Http\Resources\Academy\AttendanceLogResource;
use App\Domains\Application\Services\Academy\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        private AttendanceService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $academy = $request->user();

        $perPage = (int) $request->input('per_page', 15);
        $teacherId = $request->input('teacher_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $status = $request->input('status');

        $logs = $this->service->getAttendanceLogs(
            $academy,
            $perPage,
            $teacherId,
            $dateFrom,
            $dateTo,
            $status
        );

        return $this->successResponse(AttendanceLogResource::collection($logs));
    }

    public function todayAttendance(Request $request): JsonResponse
    {
        $academy = $request->user();

        $logs = $this->service->getTodayAttendance($academy);

        return $this->successResponse(AttendanceLogResource::collection($logs));
    }

    public function markAbsent(MarkAbsentRequest $request): JsonResponse
    {
        $academy = $request->user();

        try {
            $data = AttendanceData::fromRequest($request);
            $log = $this->service->markAbsent($academy, $data);

            return $this->successResponse(
                new AttendanceLogResource($log),
                'تم تسجيل الغياب بنجاح'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function updateNotes(UpdateAttendanceNotesRequest $request, string $logId): JsonResponse
    {
        try {
            $log = $this->service->updateNotes($logId, $request->validated('notes'));

            return $this->successResponse(
                new AttendanceLogResource($log),
                'تم تحديث الملاحظات بنجاح'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function stats(Request $request): JsonResponse
    {
        $academy = $request->user();

        $validated = $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date',
        ]);

        $stats = $this->service->getStats(
            $academy,
            $validated['date_from'],
            $validated['date_to']
        );

        return $this->successResponse($stats);
    }
}
