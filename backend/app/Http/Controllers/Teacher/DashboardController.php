<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Dashboard\DashboardRequest;
use App\Http\Resources\Teacher\EnrollmentResource;
use App\Services\Teacher\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use \App\Traits\ResolvesTeacher;

    public function __construct(
        private DashboardService $service
    ) {}

    public function getStats(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $academyId = $request->header('X-Academy-Id');

        $stats = $this->service->getStats($teacher, $academyId);

        return $this->successResponse($stats);
    }

    public function getRecentStudents(DashboardRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $limit = (int) $request->input('limit', 5);
        $academyId = $request->header('X-Academy-Id');

        $enrollments = $this->service->getRecentStudents($teacher, $academyId, $limit);

        return $this->successResponse([
            'students' => EnrollmentResource::collection($enrollments),
        ]);
    }

    public function getUpcomingLectures(DashboardRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $limit = (int) $request->input('limit', 4);
        $academyId = $request->header('X-Academy-Id');

        $lectures = $this->service->getUpcomingLectures($teacher, $academyId, $limit);

        return $this->successResponse([
            'lectures' => $lectures,
        ]);
    }

    public function getTeacherAcademies(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        $academies = $this->service->getTeacherAcademies($teacher);

        return $this->successResponse([
            'academies' => $academies,
        ]);
    }
}
