<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\Academy;
use App\Services\Admin\ReportService;
use App\Http\Requests\Admin\Report\GenerateReportRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

/**
 * Report Controller - Thin controller following best practices
 * All business logic delegated to ReportService
 */
class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService
    ) {}

    /**
     * Get list of teachers for report selection
     */
    public function teachersList(): JsonResponse
    {
        $teachers = $this->reportService->getTeachersList();

        return $this->successResponse([
            'teachers' => $teachers,
            'count' => $teachers->count(),
        ]);
    }

    /**
     * Get list of academies for report selection
     */
    public function academiesList(): JsonResponse
    {
        try {
            $academies = $this->reportService->getAcademiesList();

            return $this->successResponse([
                'academies' => $academies,
                'count' => $academies->count(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error in academiesList: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->errorResponse('حدث خطأ في جلب قائمة الأكاديميات: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Generate report based on type (unified endpoint)
     */
    public function generate(GenerateReportRequest $request): JsonResponse
    {
        $dateRange = $request->getDateRange();
        $reportType = $request->getReportType();

        $report = match ($reportType) {
            'teacher' => $this->generateTeacherReport($request, $dateRange),
            'academy' => $this->generateAcademyReport($request, $dateRange),
            'admin' => $this->generateAdminReport($dateRange),
            default => throw new \InvalidArgumentException('Invalid report type'),
        };

        return $this->successResponse($report);
    }

    /**
     * Get teacher report data (JSON) - Legacy endpoint for backward compatibility
     */
    public function teacherReport(GenerateReportRequest $request, Teacher $teacher): JsonResponse
    {
        $dateRange = $request->getDateRange();
        $report = $this->reportService->getTeacherReport(
            $teacher,
            $dateRange['start_date'],
            $dateRange['end_date']
        );

        return $this->successResponse($report->toArray());
    }

    /**
     * Get academy report data (JSON) - Legacy endpoint for backward compatibility
     */
    public function academyReport(GenerateReportRequest $request, Academy $academy): JsonResponse
    {
        $dateRange = $request->getDateRange();
        $report = $this->reportService->getAcademyReport(
            $academy,
            $dateRange['start_date'],
            $dateRange['end_date']
        );

        return $this->successResponse($report);
    }

    /**
     * Get admin overview report (JSON) - Legacy endpoint for backward compatibility
     */
    public function adminReport(GenerateReportRequest $request): JsonResponse
    {
        $dateRange = $request->getDateRange();
        $report = $this->reportService->getAdminReport(
            $dateRange['start_date'],
            $dateRange['end_date']
        );

        return $this->successResponse($report);
    }

    /**
     * Download teacher report as PDF
     */
    public function teacherReportPdf(GenerateReportRequest $request, Teacher $teacher)
    {
        $dateRange = $request->getDateRange();
        $report = $this->reportService->getTeacherReport(
            $teacher,
            $dateRange['start_date'],
            $dateRange['end_date']
        );

        $pdfContent = $this->reportService->generatePdf(
            $report->toArray(),
            'teacher',
            'تقرير المدرس: ' . $teacher->name
        );

        $filename = 'teacher-report-' . $teacher->id . '-' .
                    $dateRange['start_date']->format('Y-m-d') . '-to-' .
                    $dateRange['end_date']->format('Y-m-d') . '.pdf';

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Download academy report as PDF
     */
    public function academyReportPdf(GenerateReportRequest $request, Academy $academy)
    {
        $dateRange = $request->getDateRange();
        $report = $this->reportService->getAcademyReport(
            $academy,
            $dateRange['start_date'],
            $dateRange['end_date']
        );

        $pdfContent = $this->reportService->generatePdf(
            $report,
            'academy',
            'تقرير الأكاديمية: ' . $academy->name
        );

        $filename = 'academy-report-' . $academy->id . '-' .
                    $dateRange['start_date']->format('Y-m-d') . '-to-' .
                    $dateRange['end_date']->format('Y-m-d') . '.pdf';

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Download admin report as PDF
     */
    public function adminReportPdf(GenerateReportRequest $request)
    {
        \Log::info('[adminReportPdf] Request received', [
            'all_params' => $request->all(),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'period_preset' => $request->input('period_preset'),
        ]);

        try {
            $dateRange = $request->getDateRange();
            \Log::info('[adminReportPdf] Date range', [
                'start_date' => $dateRange['start_date']->format('Y-m-d'),
                'end_date' => $dateRange['end_date']->format('Y-m-d'),
            ]);

            $report = $this->reportService->getAdminReport(
                $dateRange['start_date'],
                $dateRange['end_date']
            );
            \Log::info('[adminReportPdf] Report generated');

            $pdfContent = $this->reportService->generatePdf(
                $report,
                'admin',
                'التقرير العام للنظام'
            );
            \Log::info('[adminReportPdf] PDF generated, size: ' . strlen($pdfContent));

            $filename = 'admin-report-' .
                        $dateRange['start_date']->format('Y-m-d') . '-to-' .
                        $dateRange['end_date']->format('Y-m-d') . '.pdf';

            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Throwable $e) {
            \Log::error('[adminReportPdf] Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Generate teacher report helper
     */
    private function generateTeacherReport(GenerateReportRequest $request, array $dateRange): array
    {
        $teacherId = $request->getTeacherId();

        if (!$teacherId) {
            throw new \InvalidArgumentException('Teacher ID is required for teacher reports');
        }

        $teacher = Teacher::findOrFail($teacherId);
        $report = $this->reportService->getTeacherReport(
            $teacher,
            $dateRange['start_date'],
            $dateRange['end_date']
        );

        return $report->toArray();
    }

    /**
     * Generate academy report helper
     */
    private function generateAcademyReport(GenerateReportRequest $request, array $dateRange): array
    {
        $academyId = $request->getAcademyId();

        if (!$academyId) {
            throw new \InvalidArgumentException('Academy ID is required for academy reports');
        }

        $academy = Academy::findOrFail($academyId);

        return $this->reportService->getAcademyReport(
            $academy,
            $dateRange['start_date'],
            $dateRange['end_date']
        );
    }

    /**
     * Generate admin report helper
     */
    private function generateAdminReport(array $dateRange): array
    {
        return $this->reportService->getAdminReport(
            $dateRange['start_date'],
            $dateRange['end_date']
        );
    }
}
