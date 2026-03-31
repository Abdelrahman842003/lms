<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Traits\ResolvesTeacher;
use App\Domains\Reporting\Application\Actions\GenerateTeacherDrilldownAction;
use App\Domains\Reporting\Application\Actions\GenerateTeacherReportAction;
use App\Domains\Reporting\Presentation\Requests\TeacherReportRequest;
use App\Domains\Reporting\Presentation\Resources\TeacherReportResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TeacherReportingController extends Controller
{
    use ResolvesTeacher;

    public function __construct(
        private readonly GenerateTeacherReportAction $generateReport,
        private readonly GenerateTeacherDrilldownAction $generateDrilldown,
    ) {}

    public function overview(TeacherReportRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);

        if (!$teacher) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $report = $this->generateReport->execute($teacher, $request->filters());

        return $this->successResponse(
            new TeacherReportResource($report),
            'Teacher report generated successfully',
        );
    }

    public function drilldown(Request $request, string $key): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);

        if (!$teacher) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 15);

        $result = $this->generateDrilldown->execute(
            $teacher,
            $key,
            $request->all(),
            $page,
            $perPage,
        );

        return $this->successResponse($result);
    }
}
