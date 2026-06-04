<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Lecture\RecordAttendanceRequest;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Application\Services\Teacher\LectureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class LectureAttendanceController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function __construct(
        private LectureService $service
    ) {}

    public function generateAttendanceCode(Request $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('generateAttendanceCode', $lecture);

        $result = $this->service->generateAttendanceCode($lecture);

        return $this->successResponse($result);
    }

    public function invalidateAttendanceCode(Request $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('invalidateAttendanceCode', $lecture);

        $this->service->invalidateAttendanceCode($lecture);

        return $this->successResponse(['message' => 'Attendance code invalidated successfully']);
    }

    public function recordAttendance(RecordAttendanceRequest $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('recordAttendance', $lecture);

        $result = $this->service->recordAttendance($lecture, $request->validated('student_id'));

        return $this->successResponse($result);
    }
}
