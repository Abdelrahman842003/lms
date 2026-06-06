<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Report\TeacherReportRequest;
use App\Domains\Application\Services\Admin\ReportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class TeacherReportController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function __construct(
        private ReportService $reportService
    ) {}

    /**
     * Get report for the authenticated teacher
     */
    public function myReport(TeacherReportRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $teacher = $this->getProfileFromRequest($request);
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        return $this->successResponse($report);
    }
}
