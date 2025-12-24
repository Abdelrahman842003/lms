<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\Admin\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Mpdf\Mpdf;

class TeacherReportController extends Controller
{
    public function __construct(
        private ReportService $reportService
    ) {}

    /**
     * Get report for the authenticated teacher
     */
    public function myReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $teacher = $request->user();
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        return $this->successResponse($report);
    }

    /**
     * Download report as PDF for the authenticated teacher
     */
    public function myReportPdf(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $teacher = $request->user();
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        $pdfContent = $this->generatePdf($report, 'teacher', 'تقرير المدرس: ' . $teacher->name);
        
        $filename = 'my-report-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.pdf';

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
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
}
