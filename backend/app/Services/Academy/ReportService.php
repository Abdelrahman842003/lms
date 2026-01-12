<?php

declare(strict_types=1);

namespace App\Services\Academy;

use App\Models\Academy;
use App\Models\TeacherAttendanceLog;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportService
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {}

    /**
     * Generate attendance report for date range
     */
    public function generateAttendanceReport(
        Academy $academy,
        string $dateFrom,
        string $dateTo,
        ?string $teacherId = null
    ): array {
        $query = TeacherAttendanceLog::forAcademy($academy->id)
            ->with('teacher')
            ->dateRange($dateFrom, $dateTo)
            ->orderBy('date', 'desc');

        if ($teacherId) {
            $query->forTeacher($teacherId);
        }

        $logs = $query->get();
        $stats = $this->attendanceService->getStats($academy, $dateFrom, $dateTo);

        return [
            'academy' => [
                'id' => $academy->id,
                'name' => $academy->name,
            ],
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
            'logs' => $logs,
            'stats' => $stats,
        ];
    }

    /**
     * Generate teachers report
     */
    public function generateTeachersReport(Academy $academy): array
    {
        $teachers = $academy->activeTeachers()->get();
        
        $teacherData = [];
        foreach ($teachers as $teacher) {
            // Get attendance stats for current month
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth = Carbon::now()->endOfMonth();

            $logs = TeacherAttendanceLog::forAcademy($academy->id)
                ->forTeacher($teacher->id)
                ->dateRange($startOfMonth, $endOfMonth)
                ->get();

            $totalPresent = $logs->where('status', 'checked_out')->count();
            $totalAbsent = $logs->where('status', 'absent')->count();
            $totalDuration = $logs->sum('duration_minutes');

            $teacherData[] = [
                'teacher' => $teacher,
                'students_count' => $teacher->activeEnrollments()->count(),
                'attendance' => [
                    'present' => $totalPresent,
                    'absent' => $totalAbsent,
                    'total_duration_minutes' => $totalDuration,
                ],
            ];
        }

        return [
            'academy' => [
                'id' => $academy->id,
                'name' => $academy->name,
            ],
            'teachers' => $teacherData,
            'summary' => [
                'total_teachers' => count($teacherData),
                'total_students' => array_sum(array_column($teacherData, 'students_count')),
            ],
        ];
    }

    /**
     * Generate monthly report
     */
    public function generateMonthlyReport(Academy $academy, int $month, int $year): array
    {
        // If month is 0, show full year report
        if ($month === 0) {
            $startDate = Carbon::createFromDate($year, 1, 1)->startOfYear();
            $endDate = Carbon::createFromDate($year, 12, 31)->endOfYear();
        } else {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();
        }

        // Get attendance logs for the period
        $attendanceLogs = TeacherAttendanceLog::forAcademy($academy->id)
            ->with('teacher')
            ->dateRange($startDate->toDateString(), $endDate->toDateString())
            ->orderBy('date', 'desc')
            ->get();

        $attendanceStats = $this->attendanceService->getStats(
            $academy,
            $startDate->toDateString(),
            $endDate->toDateString()
        );

        $teachers = $academy->activeTeachers()->get();
        $totalStudents = 0;

        foreach ($teachers as $teacher) {
            $totalStudents += $teacher->activeEnrollments()->count();
        }

        // Calculate financial details
        // Get revenue from active enrollments through academy's teachers
        $totalRevenue = 0;
        foreach ($teachers as $teacher) {
            // Get active enrollments for this teacher in the period
            $teacherRevenue = \DB::table('enrollments')
                ->join('grades', 'enrollments.grade_id', '=', 'grades.id')
                ->where('enrollments.teacher_id', $teacher->id)
                ->whereBetween('enrollments.created_at', [$startDate, $endDate])
                ->where('enrollments.is_active', 1)
                ->sum('grades.price');
            
            $totalRevenue += $teacherRevenue;
        }

        // Platform fee is typically 10% (you can adjust this)
        $platformFeePercentage = 0.10;
        $platformFees = $totalRevenue * $platformFeePercentage;
        $netRevenue = $totalRevenue - $platformFees;

        // Get billing for this month if exists (only if specific month selected)
        $billing = null;
        if ($month > 0) {
            $billing = $academy->billings()
                ->where('month', $month)
                ->where('year', $year)
                ->first();
        }

        return [
            'academy' => [
                'id' => $academy->id,
                'name' => $academy->name,
            ],
            'period' => [
                'month' => $month,
                'year' => $year,
                'from' => $startDate->toDateString(),
                'to' => $endDate->toDateString(),
            ],
            'summary' => [
                'total_teachers' => $teachers->count(),
                'total_students' => $totalStudents,
                'total_attendance_logs' => $attendanceLogs->count(),
                ...$attendanceStats['summary'] ?? [],
            ],
            'financial_details' => [
                'total_revenue' => round($totalRevenue, 2),
                'platform_fees' => round($platformFees, 2),
                'net_revenue' => round($netRevenue, 2),
                'platform_fee_percentage' => $platformFeePercentage * 100,
            ],
            'attendance_logs' => $attendanceLogs,
            'attendance_stats' => $attendanceStats,
            'billing' => $billing ? [
                'total_cost' => $billing->total_cost,
                'status' => $billing->status,
            ] : null,
        ];
    }

    /**
     * Export report as PDF
     */
    public function exportToPDF(string $reportType, array $reportData): \Illuminate\Http\Response
    {
        // Render the view to HTML
        $html = view("reports.academy.{$reportType}", $reportData)->render();
        
        // Create mPDF instance with Arabic support
        $mpdf = new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'orientation' => 'P',
            'margin_left' => 10,
            'margin_right' => 10,
            'margin_top' => 10,
            'margin_bottom' => 10,
            'default_font' => 'dejavusans',
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
        ]);
        
        // Write HTML to PDF
        $mpdf->WriteHTML($html);
        
        $filename = sprintf(
            '%s_report_%s.pdf',
            $reportType,
            now()->format('Y-m-d_His')
        );

        // Output PDF for download
        return response($mpdf->Output($filename, 'D'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
