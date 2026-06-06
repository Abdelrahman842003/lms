<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Exams\Models\Exam;
use Carbon\Carbon;
use App\Domains\Application\Models\Setting;
use App\Domains\Subscriptions\Models\PaymentLog;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function __construct(
    ) {}


    /**
     * Generate teachers report
     */
    public function generateTeachersReport(Academy $academy): array
    {
        // Get date range for current month
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // Eager load teachers with active enrollments count (avoids N+1)
        $teachers = $academy->activeTeachers()
            ->withCount(['enrollments as active_enrollments_count' => function ($q) use ($academy) {
                $q->where('academy_id', $academy->id)
                  ->where('is_active', true);
            }])
            ->get();
        $teacherProfileIds = $teachers->pluck('id')->toArray();

        foreach ($teachers as $teacher) {
            $teacherData[] = [
                'teacher' => $teacher,
                'students_count' => $teacher->active_enrollments_count,
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

        // No attendance logs needed anymore

        $teachers = $academy->activeTeachers()
            ->withCount([
                'enrollments as active_enrollments_count' => function ($q) use ($academy) {
                    $q->where('academy_id', $academy->id)
                      ->where('is_active', true);
                },
                'secretaries'
            ])
            ->get();
        $teacherProfileIds = $teachers->pluck('id')->toArray();
        
        // Calculate totals efficiently
        $totalStudents = $teachers->sum('active_enrollments_count');

        // Get teacher revenue breakdown in one query
        $teacherRevenues = DB::table('enrollments')
            ->join('grades', 'enrollments.grade_id', '=', 'grades.id')
            ->whereIn('enrollments.teacher_profile_id', $teacherProfileIds)
            ->where('enrollments.academy_id', $academy->id)
            ->whereBetween('enrollments.created_at', [$startDate, $endDate])
            ->where('enrollments.is_active', 1)
            ->selectRaw('enrollments.teacher_profile_id, SUM(grades.price) as revenue')
            ->groupBy('enrollments.teacher_profile_id')
            ->pluck('revenue', 'teacher_profile_id');

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

        // Get active subscriptions count in one query (filtered by selected period)
        $activeSubscriptionCounts = DB::table('enrollments')
            ->whereIn('teacher_profile_id', $teacherProfileIds)
            ->where('academy_id', $academy->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('is_active', 1)
            ->selectRaw('teacher_profile_id, COUNT(*) as count')
            ->groupBy('teacher_profile_id')
            ->pluck('count', 'teacher_profile_id');

        // Update teachersDetails with subscription counts
        foreach ($teachersDetails as $key => $detail) {
            $teacherProfileId = $teachers[$key]->id;
            $teachersDetails[$key]['active_subscriptions'] = $activeSubscriptionCounts[$teacherProfileId] ?? 0;
        }

        // Calculate monthly breakdown
        $monthlyBreakdown = [];
        if ($month === 0) {
            // Group by month for the whole year
            $monthlyStats = DB::table('enrollments')
                ->join('grades', 'enrollments.grade_id', '=', 'grades.id')
                ->whereIn('enrollments.teacher_profile_id', $teacherProfileIds)
                ->where('enrollments.academy_id', $academy->id)
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
                    ->whereIn('teacher_profile_id', $teacherProfileIds)
                    ->where('enrollments.academy_id', $academy->id)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->where('is_active', 1)
                    ->count(),
                'confirmed_payments_total' => $totalRevenue,
            ];
        }

        // Platform fee calculation (Seat System)
        $academyStudentPrice = (float) Setting::getValue('academy_student_price', 0);
        
        // Count total payment transactions in the period (for informational purposes)
        $totalPaymentTransactions = PaymentLog::whereIn('payment_logs.teacher_profile_id', $teacherProfileIds)
            ->join('enrollments', 'payment_logs.enrollment_id', '=', 'enrollments.id')
            ->where('enrollments.academy_id', $academy->id)
            ->whereBetween('payment_logs.confirmed_at', [$startDate, $endDate])
            ->where('payment_logs.status', 'confirmed')
            ->count();
            
        // Platform Fees = Total Active Seats * Price
        $totalSeatsQuery = \App\Domains\Enrollments\Models\Enrollment::whereIn('teacher_profile_id', $teacherProfileIds)
            ->where('academy_id', $academy->id)
            ->withTrashed()
            ->where('created_at', '<=', $endDate)
            ->where(function($q) use ($startDate) {
                $q->whereNull('deleted_at')
                  ->orWhere('deleted_at', '>=', $startDate);
            });
            
        $totalSeats = $totalSeatsQuery->count();

        $platformFees = $totalSeats * $academyStudentPrice;
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
        
        // Total unique students (distinct student IDs) in the selected period
        $totalStudentsCount = \DB::table('enrollments')
            ->whereIn('teacher_profile_id', $teacherProfileIds)
            ->where('academy_id', $academy->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('is_active', true)
            ->distinct()
            ->count('student_id');
        
        // Linked students count (Total active enrollments) in the selected period
        // Logic: Count all active enrollments that existed by the end of the period
        $linkedStudentsCount = \DB::table('enrollments')
            ->whereIn('teacher_profile_id', $teacherProfileIds)
            ->where('academy_id', $academy->id)
            ->where('created_at', '<=', $endDate)
            ->where('is_active', true)
            ->count();

        // Total lectures in the period
        $totalLecturesCount = Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [$startDate, $endDate])
            ->count();

        // Total exams in the period
        $totalExamsCount = Exam::whereIn('teacher_profile_id', $teacherProfileIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->count();

        // Total secretaries
        $totalSecretariesCount = $academy->secretaries()->count();

        // Subscription-based model (no monthly billing)
        
        // Restore this for 'total_confirmed_payments' field in response (Student Payments)
        $totalConfirmedPayments = PaymentLog::whereIn('payment_logs.teacher_profile_id', $teacherProfileIds)
            ->join('enrollments', 'payment_logs.enrollment_id', '=', 'enrollments.id')
            ->where('enrollments.academy_id', $academy->id)
            ->whereBetween('payment_logs.confirmed_at', [$startDate, $endDate])
            ->where('payment_logs.status', 'confirmed')
            ->sum('payment_logs.amount');
        
        $totalPaidToPlatform = 0;
        $remainingBalance = 0;

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
                'total_students' => $totalStudentsCount,
                'linked_students_count' => $linkedStudentsCount,
                'total_lectures_count' => $totalLecturesCount,
                'total_exams_count' => $totalExamsCount,
                'total_secretaries_count' => $totalSecretariesCount,
                'total_payment_transactions' => $totalPaymentTransactions,
            ],
            'financial_details' => [
                'total_revenue' => round((float) $totalRevenue, 2),
                'total_confirmed_payments' => round((float) $totalConfirmedPayments, 2),
                'remaining_balance' => round((float) $remainingBalance, 2),
                'net_profit' => round((float) $netRevenue, 2),
                'platform_fees' => round((float) $platformFees, 2),
                'payment_status' => $billing ? $billing->status : 'unpaid',
            ],
            'teachers_details' => $teachersDetails,
            'monthly_breakdown' => $monthlyBreakdown,
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
