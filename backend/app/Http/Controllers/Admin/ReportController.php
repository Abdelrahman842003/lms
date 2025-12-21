<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Services\Admin\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Mpdf\Mpdf;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;

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
        $teachers = Teacher::select('id', 'name', 'phone', 'is_suspended', 'created_at')
            ->withCount(['enrollments', 'secretaries'])
            ->orderBy('name')
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'phone' => $teacher->phone,
                    'status' => $teacher->is_suspended ? 'معلق' : 'نشط',
                    'students_count' => $teacher->enrollments_count,
                    'secretaries_count' => $teacher->secretaries_count,
                    'joined' => $teacher->created_at->format('Y-m-d'),
                ];
            });

        return $this->successResponse($teachers);
    }

    /**
     * Get teacher report data (JSON)
     */
    public function teacherReport(Request $request, Teacher $teacher): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        return $this->successResponse($report);
    }

    /**
     * Generate PDF using mPDF with Arabic support
     */
    private function generatePdf(array $report, string $type, string $title): string
    {
        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'default_font_size' => 11,
            'default_font' => 'xbriyaz',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 15,
            'margin_bottom' => 15,
            'tempDir' => storage_path('app/mpdf'),
        ]);

        $mpdf->SetDirectionality('rtl');
        $mpdf->autoScriptToLang = true;
        $mpdf->autoLangToFont = true;

        $html = view('pdf.report', [
            'report' => $report,
            'type' => $type,
            'title' => $title,
        ])->render();

        $mpdf->WriteHTML($html);

        return $mpdf->Output('', 'S');
    }

    /**
     * Download teacher report as PDF
     */
    public function teacherReportPdf(Request $request, Teacher $teacher)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        $pdfContent = $this->generatePdf($report, 'teacher', 'تقرير المدرس: ' . $teacher->name);
        
        $filename = 'teacher-report-' . $teacher->id . '-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.pdf';

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Get admin overview report (JSON)
     */
    public function adminReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $report = $this->reportService->getAdminReport($startDate, $endDate);

        return $this->successResponse($report);
    }

    /**
     * Download admin report as PDF
     */
    public function adminReportPdf(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $report = $this->reportService->getAdminReport($startDate, $endDate);

        $pdfContent = $this->generatePdf($report, 'admin', 'التقرير العام للنظام');
        
        $filename = 'admin-report-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.pdf';

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
