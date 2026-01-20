<?php

declare(strict_types=1);

namespace App\Services\Academy;

use App\Models\Academy;
use App\Models\TeacherAttendanceLog;
use App\Models\Lecture;
use App\Models\Exam;
use Carbon\Carbon;
use App\Models\Setting;
use App\Models\PaymentLog;
use Illuminate\Support\Facades\DB;

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

        $teachers = $academy->activeTeachers()
            ->withCount(['activeEnrollments', 'secretaries'])
            ->get();
        $teacherIds = $teachers->pluck('id')->toArray();
        
        // Calculate totals efficiently
        $totalStudents = $teachers->sum('active_enrollments_count');

        // Get teacher revenue breakdown in one query
        $teacherRevenues = DB::table('enrollments')
            ->join('grades', 'enrollments.grade_id', '=', 'grades.id')
            ->whereIn('enrollments.teacher_id', $teacherIds)
            ->whereBetween('enrollments.created_at', [$startDate, $endDate])
            ->where('enrollments.is_active', 1)
            ->selectRaw('enrollments.teacher_id, SUM(grades.price) as revenue')
            ->groupBy('enrollments.teacher_id')
            ->pluck('revenue', 'teacher_id');

        $totalRevenue = $teacherRevenues->sum();

        $teachersDetails = [];

        foreach ($teachers as $teacher) {
            $teacherRevenue = $teacherRevenues[$teacher->id] ?? 0;

            $teachersDetails[] = [
                'name' => $teacher->name,
                'status' => $teacher->is_active ? 'نشط' : 'غير نشط',
                'total_students' => $teacher->active_enrollments_count,
                'active_subscriptions' => 0, // Will be calculated separately if needed
                'secretaries_count' => $teacher->secretaries_count,
                'total_revenue' => $teacherRevenue,
            ];
        }

        // Get active subscriptions count in one query
        $activeSubscriptionCounts = DB::table('enrollments')
            ->whereIn('teacher_id', $teacherIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('is_active', 1)
            ->selectRaw('teacher_id, COUNT(*) as count')
            ->groupBy('teacher_id')
            ->pluck('count', 'teacher_id');

        // Update teachersDetails with subscription counts
        foreach ($teachersDetails as $key => $detail) {
            $teacherId = $teachers[$key]->id;
            $teachersDetails[$key]['active_subscriptions'] = $activeSubscriptionCounts[$teacherId] ?? 0;
        }

        // Calculate monthly breakdown
        $monthlyBreakdown = [];
        if ($month === 0) {
            // Group by month for the whole year
            $monthlyStats = DB::table('enrollments')
                ->join('grades', 'enrollments.grade_id', '=', 'grades.id')
                ->whereIn('enrollments.teacher_id', $teacherIds)
                ->whereYear('enrollments.created_at', $year)
                ->where('enrollments.is_active', 1)
                ->select(
                    DB::raw('MONTH(enrollments.created_at) as month'),
                    DB::raw('COUNT(*) as new_subscriptions_count'),
                    DB::raw('SUM(grades.price) as confirmed_payments_total')
                )
                ->groupBy('month')
                ->get();

            foreach ($monthlyStats as $stat) {
                $monthlyBreakdown[] = [
                    'month_name' => Carbon::createFromDate($year, $stat->month, 1)->locale('ar')->monthName . ' ' . $year,
                    'new_subscriptions_count' => $stat->new_subscriptions_count,
                    'confirmed_payments_total' => $stat->confirmed_payments_total,
                ];
            }
        } else {
            // Single month breakdown (just one row)
            $monthlyBreakdown[] = [
                'month_name' => Carbon::createFromDate($year, $month, 1)->locale('ar')->monthName . ' ' . $year,
                'new_subscriptions_count' => DB::table('enrollments')
                    ->whereIn('teacher_id', $teacherIds)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->where('is_active', 1)
                    ->count(),
                'confirmed_payments_total' => $totalRevenue,
            ];
        }

        // Platform fee calculation
        $academyStudentPrice = (float) Setting::getValue('academy_student_price', 0);
        
        $totalMonthsPaid = PaymentLog::whereIn('teacher_id', $teacherIds)
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->sum('months');

        $platformFees = $totalMonthsPaid * $academyStudentPrice;
        $netRevenue = $totalRevenue - $platformFees;

        // Get billing for this month if exists (only if specific month selected)
        $billing = null;
        if ($month > 0) {
            $billing = $academy->billings()
                ->where('month', $month)
                ->where('year', $year)
                ->first();
        }

        // Calculate additional stats
        
        // Linked students count (Total active enrollments)
        $linkedStudentsCount = \DB::table('enrollments')
            ->whereIn('teacher_id', $teacherIds)
            ->where('is_active', true)
            ->count();

        // Total lectures in the period
        $totalLecturesCount = Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [$startDate, $endDate])
            ->count();

        // Total exams in the period
        $totalExamsCount = Exam::whereIn('teacher_id', $teacherIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->count();

        // Total secretaries
        $totalSecretariesCount = $academy->secretaries()->count();

        // Calculate remaining balance
        $totalConfirmedPayments = PaymentLog::whereIn('teacher_id', $teacherIds)
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->sum('amount');

        $remainingBalance = $totalRevenue - $totalConfirmedPayments;

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
                'linked_students_count' => $linkedStudentsCount,
                'total_lectures_count' => $totalLecturesCount,
                'total_exams_count' => $totalExamsCount,
                'total_secretaries_count' => $totalSecretariesCount,
                ...$attendanceStats['summary'] ?? [],
            ],
            'financial_details' => [
                'total_revenue' => round($totalRevenue, 2),
                'total_confirmed_payments' => round($totalConfirmedPayments, 2),
                'remaining_balance' => round($remainingBalance, 2),
                'net_payments_to_academy' => round($netRevenue, 2),
                'payments_due_to_platform' => round($platformFees, 2),
                'payment_status' => $billing ? $billing->status : 'unpaid',
            ],
            'teachers_details' => $teachersDetails,
            'monthly_breakdown' => $monthlyBreakdown,
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
