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

    public function generateQrCode(Request $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('generateQrCode', $lecture);

        $result = $this->service->generateQrCode($lecture);

        return $this->successResponse($result);
    }

    public function recordAttendance(RecordAttendanceRequest $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('recordAttendance', $lecture);

        $result = $this->service->recordAttendance($lecture, $request->validated('student_id'));

        return $this->successResponse($result);
    }
}
