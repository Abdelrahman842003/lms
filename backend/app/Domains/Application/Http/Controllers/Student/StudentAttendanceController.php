<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Student\MarkAttendanceRequest;
use App\Domains\Application\Http\Requests\Student\GetAttendanceRequest;
use App\Domains\Application\Http\Resources\Student\StudentAttendanceResource;
use App\Domains\Application\Services\Student\StudentAttendanceService;
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
        $teacherProfileId = $request->validated('teacher_profile_id');
        $perPage = (int) $request->input('per_page', 10);

        $attendances = $this->attendanceService->getAttendances($student, $teacherProfileId, $perPage);

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
        $code = $request->validated('code');

        try {
            $result = $this->attendanceService->markAttendance($student, $code);

            if ($result['status'] === 'queued') {
                return $this->successResponse([
                    'status' => 'queued',
                    'position' => $result['position'],
                    'lecture_id' => $result['lecture_id'],
                    'lecture_title' => $result['lecture_title'],
                    'message' => 'أنت في قائمة الانتظار، سيتم تسجيل حضورك خلال لحظات',
                ]);
            }

            $message = $result['was_recently_created']
                ? 'تم تسجيل الحضور بنجاح'
                : 'تم تحديث الحضور بنجاح';

            return $this->successResponse([
                'status' => 'success',
                'message' => $message,
                'lecture' => $result['lecture']->title,
                'points_earned' => $result['point_transaction']?->points ?? 0,
            ]);
        } catch (\Exception $e) {
            $errorMessage = match($e->getMessage()) {
                'Invalid QR code' => 'رمز QR غير صالح',
                'QR code has expired' => 'رمز QR منتهي',
                'Invalid or expired attendance code' => 'كود الحضور غير صالح أو منتهي الصلاحية',
                default => 'حدث خطأ أثناء تسجيل الحضور: ' . $e->getMessage(),
            };

            \Illuminate\Support\Facades\Log::error('Attendance Error: ' . $e->getMessage(), [
                'student_id' => $student->id,
                'code' => $code,
                'trace' => $e->getTraceAsString()
            ]);

            return $this->errorResponse($errorMessage, 400);
        }
    }
}

