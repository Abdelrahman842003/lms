<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\Academy;
use App\Services\Admin\ReportService;
use App\Http\Requests\Admin\Report\ReportRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(
        private ReportService $reportService
    ) {}

    /**
     * Get list of teachers for report selection
     */
    public function teachersList(): JsonResponse
    {
        $teachers = $this->reportService->getTeachersList();

        return $this->successResponse($teachers);
    }

    /**
     * Get list of academies for report selection
     */
    public function academiesList(): JsonResponse
    {
        $academies = $this->reportService->getAcademiesList();

        return $this->successResponse($academies);
    }

    /**
     * Get teacher report data (JSON)
     */
    public function teacherReport(ReportRequest $request, Teacher $teacher): JsonResponse
    {
        $validated = $request->validated();

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        return $this->successResponse($report);
    }

    /**
     * Get academy report data (JSON)
     */
    public function academyReport(ReportRequest $request, Academy $academy): JsonResponse
    {
        $validated = $request->validated();

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $report = $this->reportService->getAcademyReport($academy, $startDate, $endDate);

        return $this->successResponse($report);
    }

    /**
     * Download academy report as PDF
     */
    public function academyReportPdf(ReportRequest $request, Academy $academy)
    {
        $validated = $request->validated();

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $report = $this->reportService->getAcademyReport($academy, $startDate, $endDate);

        $pdfContent = $this->reportService->generatePdf($report, 'academy', 'تقرير الأكاديمية: ' . $academy->name);
        
        $filename = 'academy-report-' . $academy->id . '-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.pdf';

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Download teacher report as PDF
     */
    public function teacherReportPdf(ReportRequest $request, Teacher $teacher)
    {
        $validated = $request->validated();

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        $pdfContent = $this->reportService->generatePdf($report, 'teacher', 'تقرير المدرس: ' . $teacher->name);
        
        $filename = 'teacher-report-' . $teacher->id . '-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.pdf';

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Get admin overview report (JSON)
     */
    public function adminReport(ReportRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $report = $this->reportService->getAdminReport($startDate, $endDate);

        return $this->successResponse($report);
    }

    /**
     * Download admin report as PDF
     */
    public function adminReportPdf(ReportRequest $request)
    {
        $validated = $request->validated();

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $report = $this->reportService->getAdminReport($startDate, $endDate);

        $pdfContent = $this->reportService->generatePdf($report, 'admin', 'التقرير العام للنظام');
        
        $filename = 'admin-report-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.pdf';

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
