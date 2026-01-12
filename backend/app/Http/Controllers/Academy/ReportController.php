<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Services\Academy\ReportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(
        private ReportService $reportService
    ) {}

    /**
     * Generate attendance report
     */
    public function attendanceReport(Request $request): JsonResponse
    {
        $academy = $request->user();

        $validated = $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date',
            'teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $report = $this->reportService->generateAttendanceReport(
            $academy,
            $validated['date_from'],
            $validated['date_to'],
            $validated['teacher_id'] ?? null
        );

        return $this->successResponse($report);
    }

    /**
     * Generate teachers report
     */
    public function teachersReport(Request $request): JsonResponse
    {
        $academy = $request->user();

        $report = $this->reportService->generateTeachersReport($academy);

        return $this->successResponse($report);
    }

    /**
     * Generate monthly report
     */
    public function monthlyReport(Request $request): JsonResponse
    {
        $academy = $request->user();

        $validated = $request->validate([
            'month' => 'required|integer|min:0|max:12',
            'year' => 'required|integer|min:2020',
        ]);

        $report = $this->reportService->generateMonthlyReport(
            $academy,
            (int) $validated['month'],
            (int) $validated['year']
        );

        return $this->successResponse($report);
    }

    /**
     * Export report as PDF
     */
    public function exportPDF(Request $request)
    {
        $academy = $request->user();

        $validated = $request->validate([
            'report_type' => 'required|in:attendance,teachers,monthly',
            'date_from' => 'required_if:report_type,attendance|date',
            'date_to' => 'required_if:report_type,attendance|date',
            'month' => 'required_if:report_type,monthly|integer|min:0|max:12',
            'year' => 'required_if:report_type,monthly|integer|min:2020',
            'teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $reportType = $validated['report_type'];
        $reportData = [];

        switch ($reportType) {
            case 'attendance':
                $reportData = $this->reportService->generateAttendanceReport(
                    $academy,
                    $validated['date_from'],
                    $validated['date_to'],
                    $validated['teacher_id'] ?? null
                );
                break;

            case 'teachers':
                $reportData = $this->reportService->generateTeachersReport($academy);
                break;

            case 'monthly':
                $reportData = $this->reportService->generateMonthlyReport(
                    $academy,
                    (int) $validated['month'],
                    (int) $validated['year']
                );
                break;
        }

        return $this->reportService->exportToPDF($reportType, $reportData);
    }
}
