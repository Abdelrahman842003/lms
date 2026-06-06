<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Dashboard\DashboardRequest;
use App\Domains\Application\Http\Resources\Teacher\EnrollmentResource;
use App\Domains\Application\Services\Teacher\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function __construct(
        private DashboardService $service
    ) {}

    public function getStats(Request $request): JsonResponse
    {
        $teacher = $this->getProfileFromRequest($request);
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');

        $stats = $this->service->getStats($teacher, $academyId);

        return $this->successResponse($stats);
    }

    public function getRecentStudents(DashboardRequest $request): JsonResponse
    {
        $teacher = $this->getProfileFromRequest($request);
        $limit = (int) $request->input('limit', 5);
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');

        $enrollments = $this->service->getRecentStudents($teacher, $academyId, $limit);

        return $this->successResponse([
            'students' => EnrollmentResource::collection($enrollments),
        ]);
    }

    public function getUpcomingLectures(DashboardRequest $request): JsonResponse
    {
        $teacher = $this->getProfileFromRequest($request);
        $limit = (int) $request->input('limit', 4);
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');

        $lectures = $this->service->getUpcomingLectures($teacher, $academyId, $limit);

        return $this->successResponse([
            'lectures' => $lectures,
        ]);
    }

    public function getTeacherAcademies(Request $request): JsonResponse
    {
        $teacher = $this->getProfileFromRequest($request);
        
        $academies = $this->service->getTeacherAcademies($teacher);

        return $this->successResponse([
            'academies' => $academies,
        ]);
    }
}
