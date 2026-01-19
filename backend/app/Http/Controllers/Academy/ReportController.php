<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academy\AttendanceReportRequest;
use App\Http\Requests\Academy\ExportReportRequest;
use App\Http\Requests\Academy\MonthlyReportRequest;
use App\Services\Academy\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private ReportService $service
    ) {}

    public function attendanceReport(AttendanceReportRequest $request): JsonResponse
    {
        $academy = $request->user();

        $report = $this->service->generateAttendanceReport(
            $academy,
            $request->validated('date_from'),
            $request->validated('date_to'),
            $request->validated('teacher_id')
        );

        return $this->successResponse($report);
    }

    public function teachersReport(Request $request): JsonResponse
    {
        $academy = $request->user();

        $report = $this->service->generateTeachersReport($academy);

        return $this->successResponse($report);
    }

    public function monthlyReport(MonthlyReportRequest $request): JsonResponse
    {
        $academy = $request->user();

        $report = $this->service->generateMonthlyReport(
            $academy,
            (int) $request->validated('month'),
            (int) $request->validated('year')
        );

        return $this->successResponse($report);
    }

    public function exportPDF(ExportReportRequest $request)
    {
        $academy = $request->user();
        $reportType = $request->validated('report_type');
        $reportData = [];

        switch ($reportType) {
            case 'attendance':
                $reportData = $this->service->generateAttendanceReport(
                    $academy,
                    $request->validated('date_from'),
                    $request->validated('date_to'),
                    $request->validated('teacher_id')
                );
                break;

            case 'teachers':
                $reportData = $this->service->generateTeachersReport($academy);
                break;

            case 'monthly':
                $reportData = $this->service->generateMonthlyReport(
                    $academy,
                    (int) $request->validated('month'),
                    (int) $request->validated('year')
                );
                break;
        }

        return $this->service->exportToPDF($reportType, $reportData);
    }
}
