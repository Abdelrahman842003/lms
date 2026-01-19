<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Lecture\RecordAttendanceRequest;
use App\Models\Lecture;
use App\Services\Teacher\LectureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LectureAttendanceController extends Controller
{
    use \App\Traits\ResolvesTeacher;

    public function __construct(
        private LectureService $service
    ) {}

    public function generateQrCode(Request $request, Lecture $lecture): JsonResponse
    {
        // Ensure the user is the teacher of this lecture
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $result = $this->service->generateQrCode($lecture);

        return $this->successResponse($result);
    }

    public function recordAttendance(RecordAttendanceRequest $request, Lecture $lecture): JsonResponse
    {
        // Ensure the user is the teacher of this lecture
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $result = $this->service->recordAttendance($lecture, $request->validated('student_id'));

        return $this->successResponse($result);
    }
}
