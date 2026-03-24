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

        $teacher = $this->getTeacherFromRequest($request);
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        return $this->successResponse($report);
    }

    /**
     * Download report as PDF for the authenticated teacher
     */
    public function myReportPdf(TeacherReportRequest $request): Response
    {
        $validated = $request->validated();
        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $teacher = $this->getTeacherFromRequest($request);
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        $pdfContent = $this->reportService->generatePdf($report, 'teacher', 'تقرير المدرس: ' . $teacher->name);
        
        $filename = 'my-report-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.pdf';

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
