<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\MarkAttendanceRequest;
use App\Http\Requests\Student\GetAttendanceRequest;
use App\Http\Resources\Student\StudentAttendanceResource;
use App\Services\Student\StudentAttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAttendanceController extends Controller
{
    public function __construct(
        private StudentAttendanceService $attendanceService
    ) {}

    /**
     * Get attendance records for a teacher
     */
    public function index(GetAttendanceRequest $request): JsonResponse
    {
        $student = $request->user();
        $teacherId = $request->validated('teacher_id');
        $perPage = (int) $request->input('per_page', 10);

        $attendances = $this->attendanceService->getAttendances($student, $teacherId, $perPage);

        return $this->successResponse(
            StudentAttendanceResource::collection($attendances)->response()->getData(true)
        );
    }

    /**
     * Mark attendance using QR code
     */
    public function markAttendance(MarkAttendanceRequest $request): JsonResponse
    {
        $student = $request->user();
        $token = $request->validated('token');

        try {
            $result = $this->attendanceService->markAttendance($student, $token);

            $message = $result['was_recently_created']
                ? 'تم تسجيل الحضور بنجاح'
                : 'تم تحديث الحضور بنجاح';

            return $this->successResponse([
                'message' => $message,
                'lecture' => $result['lecture']->title,
                'points_earned' => $result['point_transaction']?->points ?? 0,
            ]);
        } catch (\Exception $e) {
            $errorMessage = match($e->getMessage()) {
                'Invalid QR code' => 'رمز QR غير صالح',
                'QR code has expired' => 'رمز QR منتهي',
                default => 'حدث خطأ أثناء تسجيل الحضور',
            };

            return $this->errorResponse($errorMessage, 400);
        }
    }
}

