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
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

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

        // Get billing for this month if exists
        $billing = $academy->billings()
            ->where('month', $month)
            ->where('year', $year)
            ->first();

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
            'overview' => [
                'total_teachers' => $teachers->count(),
                'total_students' => $totalStudents,
            ],
            'attendance' => $attendanceStats,
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
        $pdf = Pdf::loadView("reports.academy.{$reportType}", $reportData);
        
        $filename = sprintf(
            '%s_report_%s.pdf',
            $reportType,
            now()->format('Y-m-d_His')
        );

        return $pdf->download($filename);
    }
}
