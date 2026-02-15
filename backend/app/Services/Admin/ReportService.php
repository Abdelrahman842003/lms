<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\Teacher;
use App\Models\Student;
use App\Models\Secretary;
use App\Models\Enrollment;
use App\Models\PaymentLog;
use App\Models\Setting;
use App\Models\TeacherSubscription;
use Carbon\Carbon;
use App\Models\Academy;
use Illuminate\Support\Collection;

class ReportService
{
    /**
     * Get list of teachers for report selection
     */
    public function getTeachersList(): Collection
    {
        return Teacher::select('id', 'name', 'phone', 'status', 'created_at')
            ->where(function($query) {
                $query->whereDoesntHave('academies')
                      ->orWhereHas('enrollments', function($q) {
                          $q->whereNull('academy_id');
                      })
                      ->orWhere('subscription_fee', '>', 0);
            })
            ->withCount(['enrollments', 'secretaries'])
            ->orderBy('name')
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'phone' => $teacher->phone,
                    'status' => match($teacher->status) {
                        'active' => 'نشط',
                        'suspended' => 'معلق',
                        'pending' => 'في انتظار الموافقة',
                        default => 'غير معروف'
                    },
                    'students_count' => $teacher->enrollments_count,
                    'secretaries_count' => $teacher->secretaries_count,
                    'joined' => $teacher->created_at->format('Y-m-d'),
                ];
            });
    }

    /**
     * Get list of academies for report selection
     */
    public function getAcademiesList(): Collection
    {
        return Academy::select('id', 'name', 'phone', 'is_active', 'created_at')
            ->withCount(['teachers'])
            ->orderBy('name')
            ->get()
            ->map(function ($academy) {
                return [
                    'id' => $academy->id,
                    'name' => $academy->name,
                    'phone' => $academy->phone,
                    'status' => $academy->is_active ? 'نشط' : 'غير نشط',
                    'teachers_count' => $academy->teachers_count,
                    'students_count' => $academy->total_students_count,
                    'joined' => $academy->created_at->format('Y-m-d'),
                ];
            });
    }

    /**
     * Generate PDF using mPDF with Arabic support
     */
    public function generatePdf(array $report, string $type, string $title): string
    {
        $mpdf = new \Mpdf\Mpdf([
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
     * Get report data for a specific teacher
     */
    public function getTeacherReport(Teacher $teacher, Carbon $startDate, Carbon $endDate): array
    {
        $endDate = $endDate->copy()->endOfDay();
        $pricePerStudent = \App\Services\HelperService::getPricePerStudent();

        // Students data
        $enrollmentsQuery = Enrollment::where('teacher_id', $teacher->id);
        $totalStudents = (clone $enrollmentsQuery)->count();
        $activeStudents = (clone $enrollmentsQuery)->where('is_active', true)->count();
        
        // Total months paid in period (Billable Months)
        $billableMonths = PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('months');

        // Secretaries
        $totalSecretaries = Secretary::where('teacher_id', $teacher->id)->count();

        // Confirmed payments in period
        $confirmedPayments = PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('amount');

        // Pending payments
        $pendingPayments = PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->sum('amount');

        // Paying students count (unique students who paid in this period)
        $payingStudentsCount = PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->distinct('student_id')
            ->count('student_id');
        
        // Platform fees calculation
        // Use the unified HelperService price
        $teacherStudentPrice = \App\Services\HelperService::getPricePerStudent();
        
        $platformFees = $billableMonths * $teacherStudentPrice;

        // Calculated revenue based on total months paid (subscriptions)
        $calculatedRevenue = $billableMonths * $teacherStudentPrice;

        // Calculate total revenue from enrollments (similar to academy)
        $totalRevenue = \DB::table('enrollments')
            ->join('grades', 'enrollments.grade_id', '=', 'grades.id')
            ->where('enrollments.teacher_id', $teacher->id)
            ->whereBetween('enrollments.created_at', [$startDate, $endDate])
            ->where('enrollments.is_active', 1)
            ->sum('grades.price');

        // Calculate remaining balance and net payments
        $remainingBalance = $totalRevenue - $confirmedPayments;
        $netPaymentsToTeacher = $confirmedPayments - $platformFees;

        // Monthly breakdown
        $monthlyData = $this->getMonthlyBreakdown($teacher->id, $startDate, $endDate, 'teacher');

        // Monthly subscription breakdown
        $subscriptionData = $this->getMonthlySubscriptions($teacher, $startDate, $endDate, $pricePerStudent);

        // Calculate totals from subscriptions
        $totalDue = array_sum(array_column($subscriptionData, 'amount_due'));
        $totalPaid = array_sum(array_column($subscriptionData, 'amount_paid'));
        $totalRemaining = $totalDue - $totalPaid;

        // Align platformFees with totalDue (Source of Truth)
        $platformFees = $totalDue;
        $calculatedRevenue = $totalDue; // For consistency

        return [
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'phone' => $teacher->phone,
                'joined' => $teacher->created_at->format('Y-m-d'),
                'status' => match($teacher->status) {
                    'active' => 'نشط',
                    'suspended' => 'معلق',
                    'pending' => 'في انتظار الموافقة',
                    default => 'غير معروف'
                },
            ],
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'duration_months' => $startDate->diffInMonths($endDate) + 1,
            ],
            'summary' => [
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'new_enrollments' => $billableMonths, // Keeping key name for frontend compatibility, but value is billable months
                'total_secretaries' => $totalSecretaries,
                'confirmed_payments' => (float) $confirmedPayments,
                'pending_payments' => (float) $pendingPayments,
                'calculated_revenue' => $calculatedRevenue,
                'price_per_student' => $pricePerStudent,
                'teacher_student_price' => (float) $teacherStudentPrice,
                'total_due' => $totalDue,
                'total_paid' => $totalPaid,
                'total_remaining' => $totalRemaining,
                'paying_students_count' => $payingStudentsCount,
                'not_paying_students_count' => $totalStudents - $payingStudentsCount,
                'platform_fees' => (float) $platformFees,
            ],
            'financial_details' => [
                'total_revenue' => round((float) $totalRevenue, 2),
                'total_confirmed_payments' => round((float) $confirmedPayments, 2),
                'uncollected_revenue' => round((float) $remainingBalance, 2),
                'net_profit' => round((float) $netPaymentsToTeacher, 2),
                'platform_fees' => round((float) $platformFees, 2),
            ],
            'monthly_breakdown' => $monthlyData,
            'subscription_breakdown' => $subscriptionData,
            'student_account_breakdown' => $this->getStudentAccountBreakdown($teacher, $startDate, $endDate),
            'month' => $startDate->month,
            'year' => $startDate->year,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get report data for a specific academy
     */
    public function getAcademyReport(Academy $academy, Carbon $startDate, Carbon $endDate): array
    {
        $endDate = $endDate->copy()->endOfDay();
        $pricePerStudent = \App\Services\HelperService::getAcademyStudentPrice();

        // Teachers data
        $teachersQuery = $academy->teachers();
        $totalTeachers = (clone $teachersQuery)->count();
        $activeTeachers = (clone $teachersQuery)->wherePivot('is_active', true)->count();

        // Students data (via teachers)
        // Since we don't have a direct relationship, we iterate over teachers
        $academyTeachers = $academy->activeTeachers()->with('enrollments')->get();
        
        $totalEnrollments = 0;
        $activeEnrollments = 0;
        $uniqueStudentIds = [];

        foreach ($academyTeachers as $teacher) {
            foreach ($teacher->enrollments as $enrollment) {
                // Filter by date to match Academy Report logic (All Active Enrollments up to End Date)
                if ($enrollment->created_at <= $endDate) {
                    $totalEnrollments++;
                    if ($enrollment->is_active) {
                        $activeEnrollments++;
                    }
                    $uniqueStudentIds[] = $enrollment->student_id;
                }
            }
        }
        
        $totalAcademyStudents = count(array_unique($uniqueStudentIds));

        // Get teacher IDs for this academy
        $teacherIds = $academyTeachers->pluck('id')->toArray();

        // Calculate total months paid (subscriptions) in the period
        $totalMonthsPaid = PaymentLog::whereIn('teacher_id', $teacherIds)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('months');

        // Count total payment transactions (confirmed payments)
        $totalPaymentTransactions = PaymentLog::whereIn('teacher_id', $teacherIds)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->count();

        // Calculate Platform Fees (Revenue for the Platform)
        $platformFees = $totalMonthsPaid * $pricePerStudent;

        // Calculate Total Revenue (Collected from Students)
        // We need to sum up the price of grades for all active enrollments/payments
        // For simplicity and to match Academy logic, we'll use the same query structure
        $totalRevenue = \DB::table('enrollments')
            ->join('grades', 'enrollments.grade_id', '=', 'grades.id')
            ->whereIn('enrollments.teacher_id', $teacherIds)
            ->whereBetween('enrollments.created_at', [$startDate, $endDate])
            ->where('enrollments.is_active', 1)
            ->sum('grades.price');

        // Calculate Net Revenue (Academy Share)
        $netRevenue = $totalRevenue - $platformFees;

        // Expected Revenue for Platform (Same as Platform Fees)
        $expectedRevenue = $platformFees;

        // Confirmed payments - using subscription-based model (not monthly billing)
        $confirmedPayments = 0;

        // Monthly breakdown
        // We can reuse getMonthlyBreakdown but we need to pass teacher IDs
        // For now, let's just get overall monthly breakdown for these teachers
        $monthlyData = $this->getMonthlyBreakdownForAcademy($academyTeachers->pluck('id')->toArray(), $startDate, $endDate);

        return [
            'academy' => [
                'id' => $academy->id,
                'name' => $academy->name,
                'phone' => $academy->phone,
                'joined' => $academy->created_at->format('Y-m-d'),
                'status' => $academy->is_active ? 'نشط' : 'غير نشط',
            ],
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'duration_months' => $startDate->diffInMonths($endDate) + 1,
            ],
            'summary' => [
                'total_teachers' => $totalTeachers,
                'active_teachers' => $activeTeachers,
                'total_academy_students' => $totalAcademyStudents,
                'total_enrollments' => $totalEnrollments,
                'active_enrollments' => $activeEnrollments,
                'total_subscriptions' => (int) $totalMonthsPaid,
                'total_payment_transactions' => $totalPaymentTransactions,
                'expected_revenue' => $expectedRevenue, // Platform Fees
                'total_revenue' => $totalRevenue, // Total from Students
                'platform_fees' => $platformFees,
                'net_revenue' => $netRevenue,
                'confirmed_payments' => (float) $confirmedPayments,
                'remaining_balance' => $platformFees - $confirmedPayments,
                'payment_status' => $confirmedPayments == 0 ? 'لم يدفع' : ($platformFees - $confirmedPayments <= 0 ? 'مدفوع' : 'متبقي دفعات'),
                'price_per_student' => $pricePerStudent,
            ],
            'monthly_breakdown' => $monthlyData,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get monthly breakdown for academy (list of teachers)
     */
    private function getMonthlyBreakdownForAcademy(array $teacherIds, Carbon $startDate, Carbon $endDate): array
    {
        $months = [];
        $currentMonth = $startDate->copy()->startOfMonth();
        $lastMonth = $endDate->copy()->startOfMonth();
        
        while ($currentMonth <= $lastMonth) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();
            
            $queryStart = $monthStart->lt($startDate) ? $startDate->copy()->startOfDay() : $monthStart;
            $queryEnd = $monthEnd->gt($endDate) ? $endDate->copy()->endOfDay() : $monthEnd->endOfDay();
            
            $newEnrollments = Enrollment::whereIn('teacher_id', $teacherIds)
                ->whereBetween('created_at', [$queryStart, $queryEnd])
                ->count();

            $months[] = [
                'month' => $currentMonth->format('Y-m'),
                'month_name' => \App\Services\HelperService::getArabicMonthName($currentMonth->month) . ' ' . $currentMonth->year,
                'new_enrollments' => $newEnrollments,
                'confirmed_payments' => 0,
            ];
            
            $currentMonth->addMonth();
        }
        
        return $months;
    }
    private function getMonthlySubscriptions(Teacher $teacher, Carbon $startDate, Carbon $endDate, float $pricePerStudent): array
    {
        $months = [];
        $currentMonth = $startDate->copy()->startOfMonth();
        $lastMonth = $endDate->copy()->startOfMonth();
        
        // Get teacher_student_price from settings (Unified)
        $teacherStudentPrice = \App\Services\HelperService::getPricePerStudent();
        
        while ($currentMonth <= $lastMonth) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();
            
            // Try to find existing subscription record first (Source of Truth)
            $subscription = TeacherSubscription::where('teacher_id', $teacher->id)
                ->where('month', $monthStart->format('Y-m-d'))
                ->first();

            if ($subscription) {
                $totalMonthsPaidInMonth = $subscription->student_count; // This stores billable months now
                $amountDue = $subscription->amount_due;
                $amountPaid = $subscription->amount_paid;
                $status = $subscription->status;
            } else {
                // Fallback: Calculate on the fly (Potential Revenue - Seat System)
                $query = \App\Models\Enrollment::where('teacher_id', $teacher->id)
                    ->withTrashed()
                    ->where('created_at', '<=', $monthEnd)
                    ->where(function($q) use ($monthStart) {
                        $q->whereNull('deleted_at')
                          ->orWhere('deleted_at', '>=', $monthStart);
                    });
                    
                $totalMonthsPaidInMonth = $query->count(); // Actually total seats
                
                $amountDue = $totalMonthsPaidInMonth * $teacherStudentPrice;
                $amountPaid = 0; // No subscription record means no payment to platform yet
                $status = 'pending';
            }
            
            $months[] = [
                'month' => $currentMonth->format('Y-m'),
                'month_name' => \App\Services\HelperService::getArabicMonthName($currentMonth->month) . ' ' . $currentMonth->year,
                'student_count' => (int) $totalMonthsPaidInMonth,
                'amount_due' => (float) $amountDue,
                'amount_paid' => (float) $amountPaid,
                'amount_remaining' => (float) ($amountDue - $amountPaid),
                'status' => $status,
                'status_label' => \App\Services\HelperService::getStatusLabel($status),
            ];

            $currentMonth->addMonth();
        }
        
        return $months;
    }

    /**
     * Get monthly student account breakdown (Expected vs Actual from students)
     */
    private function getStudentAccountBreakdown(Teacher $teacher, Carbon $startDate, Carbon $endDate): array
    {
        $months = [];
        $currentMonth = $startDate->copy()->startOfMonth();
        $lastMonth = $endDate->copy()->startOfMonth();
        
        while ($currentMonth <= $lastMonth) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();
            
            // Adjust to actual date range for payments
            $queryStart = $monthStart->lt($startDate) ? $startDate->copy()->startOfDay() : $monthStart;
            $queryEnd = $monthEnd->gt($endDate) ? $endDate->copy()->endOfDay() : $monthEnd->endOfDay();

            // 1. Calculate Amount Due (Expected Revenue)
            // Logic: Sum of (Group Price OR Grade Price) for all active students in this month
            // We consider an enrollment active for this month if it was created before month end
            // and (not deleted OR deleted after month start)
            
            $enrollments = Enrollment::where('teacher_id', $teacher->id)
                ->withTrashed()
                ->where('created_at', '<=', $monthEnd)
                ->where(function($q) use ($monthStart) {
                    $q->whereNull('deleted_at')
                      ->orWhere('deleted_at', '>=', $monthStart);
                })
                ->with(['group', 'grade'])
                ->get();

            $amountDue = 0;
            $studentCount = 0;

            foreach ($enrollments as $enrollment) {
                $price = 0;
                if ($enrollment->group && $enrollment->group->price) {
                    $price = $enrollment->group->price;
                } elseif ($enrollment->grade && $enrollment->grade->price) {
                    $price = $enrollment->grade->price;
                }
                
                $amountDue += $price;
                $studentCount++;
            }

            // 2. Calculate Amount Paid (Actual Revenue)
            $amountPaid = PaymentLog::where('teacher_id', $teacher->id)
                ->where('status', 'confirmed')
                ->whereBetween('confirmed_at', [$queryStart, $queryEnd])
                ->sum('amount');

            $amountRemaining = $amountDue - $amountPaid;

            // Determine status
            $status = 'pending';
            if ($amountRemaining <= 0 && $amountPaid > 0) {
                $status = 'paid';
            } elseif ($amountPaid > 0) {
                $status = 'partial';
            }

            $months[] = [
                'month' => $currentMonth->format('Y-m'),
                'month_name' => \App\Services\HelperService::getArabicMonthName($currentMonth->month) . ' ' . $currentMonth->year,
                'student_count' => $studentCount,
                'amount_due' => (float) $amountDue,
                'amount_paid' => (float) $amountPaid,
                'amount_remaining' => (float) max(0, $amountRemaining),
                'status' => $status,
                'status_label' => \App\Services\HelperService::getStatusLabel($status),
            ];

            $currentMonth->addMonth();
        }
        
        return $months;
    }




    /**
     * Get Arabic status label
     */
    private function getStatusLabel(string $status): string
    {
        return match($status) {
            'paid' => 'مدفوع',
            'partial' => 'مدفوع جزئياً',
            'pending' => 'غير مدفوع',
            default => $status,
        };
    }


    /**
     * Get admin overview report
     */
    public function getAdminReport(Carbon $startDate, Carbon $endDate): array
    {
        $endDate = $endDate->copy()->endOfDay();
        $pricePerStudent = \App\Services\HelperService::getPricePerStudent();
        $academyStudentPrice = \App\Services\HelperService::getAcademyStudentPrice();

        // 1. Counts
        $totalAcademies = Academy::count();
        
        // Independent Teachers: Teachers who do NOT belong to any academy OR have explicit subscription fee
        $independentTeachersCount = Teacher::where(function($q) {
            $q->whereDoesntHave('academies')
              ->orWhere('subscription_fee', '>', 0);
        })->count();
        
        $totalTeachers = Teacher::count();
        $activeTeachers = Teacher::where('status', 'active')->count();
        $suspendedTeachers = Teacher::where('status', 'suspended')->count();
        
        $totalStudents = Student::count();
        $totalSecretaries = Secretary::count();
        $totalEnrollments = Enrollment::count();
        $activeEnrollments = Enrollment::where('is_active', true)->count();

        // New in period
        $newTeachers = Teacher::whereBetween('created_at', [$startDate, $endDate])->count();
        $newStudents = Student::whereBetween('created_at', [$startDate, $endDate])->count();
        $newEnrollments = Enrollment::whereBetween('created_at', [$startDate, $endDate])->count();

        // 2. Subscriptions (Months Paid) Calculation
        
        // A. Academy Subscriptions (Months paid by students in academies)
        $academySubscriptions = PaymentLog::whereHas('enrollment', function($q) {
                $q->whereNotNull('academy_id');
            })
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('months');

        // B. Independent Subscriptions (Months paid by independent students)
        $independentSubscriptions = PaymentLog::whereHas('enrollment', function($q) {
                $q->whereNull('academy_id');
            })
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('months');

        // Total Subscriptions
        $totalSubscriptions = $academySubscriptions + $independentSubscriptions;

        // 3. Financial Summary Calculation
        
        // A. Independent Teachers Commission
        $independentCommission = $independentSubscriptions * $pricePerStudent;

        // B. Academy Revenue (Platform Share)
        $academyPlatformShare = $academySubscriptions * $academyStudentPrice;

        // C. Net Platform Profit
        $netPlatformProfit = $independentCommission + $academyPlatformShare;

        // Other financial stats (keeping for backward compatibility if needed, or general info)
        $confirmedPayments = PaymentLog::where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('amount');

        // Teachers breakdown
        $teachersBreakdown = $this->getTeachersBreakdown($pricePerStudent, $startDate, $endDate);

        // Monthly breakdown
        $monthlyData = $this->getMonthlyBreakdown(null, $startDate, $endDate, 'admin');

        return [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'duration_months' => $startDate->diffInMonths($endDate) + 1,
            ],
            'summary' => [
                // Counts
                'total_academies' => $totalAcademies,
                'independent_teachers_count' => $independentTeachersCount,
                'total_teachers' => $totalTeachers,
                'active_teachers' => $activeTeachers,
                'suspended_teachers' => $suspendedTeachers,
                'new_teachers' => $newTeachers,
                'total_students' => $totalStudents,
                'new_students' => $newStudents,
                'total_secretaries' => $totalSecretaries,
                'total_enrollments' => $totalEnrollments,
                'active_enrollments' => $activeEnrollments,
                'new_enrollments' => $newEnrollments,
                
                // Subscriptions
                'total_subscriptions' => (int) $totalSubscriptions,
                'academy_subscriptions' => (int) $academySubscriptions,
                'independent_subscriptions' => (int) $independentSubscriptions,
                
                // Financials
                'confirmed_payments' => (float) $confirmedPayments, // Total raw payments (might include full academy revenue before split if logic differs, but usually payment log tracks what was paid to platform? No, for academy it might be different. Sticking to calculated values for report)
                'independent_commission' => (float) $independentCommission,
                'academy_platform_share' => (float) $academyPlatformShare,
                'net_platform_profit' => (float) $netPlatformProfit,
                
                'price_per_student' => $pricePerStudent,
                'academy_student_price' => $academyStudentPrice,
            ],
            'teachers_breakdown' => $teachersBreakdown,
            'monthly_breakdown' => $monthlyData,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get teachers breakdown for admin report - Optimized to avoid N+1
     */
    private function getTeachersBreakdown(float $pricePerStudent, Carbon $startDate, Carbon $endDate): array
    {
        // Get payment totals per teacher in one query
        $paymentsByTeacher = PaymentLog::where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->selectRaw('teacher_id, SUM(amount) as total_paid')
            ->groupBy('teacher_id')
            ->pluck('total_paid', 'teacher_id');

        // Get months paid per teacher for revenue calculation
        $monthsByTeacher = PaymentLog::where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->selectRaw('teacher_id, SUM(months) as total_months')
            ->groupBy('teacher_id')
            ->pluck('total_months', 'teacher_id');

        return Teacher::select('id', 'name', 'status', 'created_at')
            ->withCount([
                'enrollments as total_students',
                'enrollments as active_students' => fn($q) => $q->where('is_active', true),
                'secretaries'
            ])
            ->get()
            ->map(function ($teacher) use ($pricePerStudent, $paymentsByTeacher, $monthsByTeacher) {
                $teacherMonths = $monthsByTeacher[$teacher->id] ?? 0;
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'status' => match($teacher->status) {
                        'active' => 'نشط',
                        'suspended' => 'معلق',
                        'pending' => 'في انتظار الموافقة',
                        default => 'غير معروف'
                    },
                    'total_students' => $teacher->total_students,
                    'active_students' => $teacher->active_students,
                    'secretaries' => $teacher->secretaries_count,
                    'subscriptions' => (int) $teacherMonths,
                    'revenue' => $teacherMonths * $pricePerStudent,
                    'paid' => (float) ($paymentsByTeacher[$teacher->id] ?? 0),
                    'joined' => $teacher->created_at->format('Y-m-d'),
                ];
            })->toArray();
    }

    /**
     * Get monthly breakdown of enrollments and payments
     */
    private function getMonthlyBreakdown(?string $teacherId, Carbon $startDate, Carbon $endDate, string $type): array
    {
        $months = [];
        
        // Start from the first day of startDate's month
        $currentMonth = $startDate->copy()->startOfMonth();
        $lastMonth = $endDate->copy()->startOfMonth();
        
        while ($currentMonth <= $lastMonth) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();
            
            // Adjust to actual date range
            $queryStart = $monthStart->lt($startDate) ? $startDate->copy()->startOfDay() : $monthStart;
            $queryEnd = $monthEnd->gt($endDate) ? $endDate->copy()->endOfDay() : $monthEnd->endOfDay();
            
            $enrollmentsQuery = Enrollment::query();
            $paymentsQuery = PaymentLog::where('status', 'confirmed');
            
            if ($teacherId) {
                $enrollmentsQuery->where('teacher_id', $teacherId);
                $paymentsQuery->where('teacher_id', $teacherId);
            }
            
            $newEnrollments = (clone $enrollmentsQuery)
                ->whereBetween('created_at', [$queryStart, $queryEnd])
                ->count();
                
            $payments = (clone $paymentsQuery)
                ->whereBetween('confirmed_at', [$queryStart, $queryEnd])
                ->sum('amount');
            
            $months[] = [
                'month' => $currentMonth->format('Y-m'),
                'month_name' => \App\Services\HelperService::getArabicMonthName($currentMonth->month) . ' ' . $currentMonth->year,
                'new_enrollments' => $newEnrollments,
                'confirmed_payments' => (float) $payments,
            ];
            
            $currentMonth->addMonth();
        }
        
        return $months;
    }

}
