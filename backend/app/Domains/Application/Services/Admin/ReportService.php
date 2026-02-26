<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Admin;

use App\DTO\Reports\ReportPeriodData;
use App\DTO\Reports\TeacherReportData;
use App\DTO\Reports\TeacherReportSummaryData;
use App\DTO\Reports\AcademyReportSummaryData;
use App\DTO\Reports\AdminReportSummaryData;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Auth\Models\Academy;
use App\Domains\Subscriptions\Models\AcademySubscription;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Subscriptions\Models\PaymentLog;
use App\Domains\Subscriptions\Models\TeacherSubscription;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ReportService
{
    /**
     * Get list of teachers for report selection with eager loading
     */
    public function getTeachersList(): Collection
    {
        return Teacher::select('id', 'name', 'phone', 'status', 'created_at', 'subscription_fee')
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
                    'status' => $this->getStatusLabel($teacher->status),
                    'students_count' => $teacher->enrollments_count,
                    'secretaries_count' => $teacher->secretaries_count,
                    'joined' => $teacher->created_at->format('Y-m-d'),
                    'subscription_fee' => (float) $teacher->subscription_fee,
                ];
            });
    }

    /**
     * Get list of academies for report selection with eager loading
     */
    public function getAcademiesList(): Collection
    {
        return Academy::select('id', 'name', 'phone', 'is_active', 'created_at', 'subscription_fee', 'paid_amount', 'plan_type', 'plan_expires_at', 'plan_max_students', 'is_unlimited_students')
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
                    'students_count' => $academy->total_students_count ?? 0,
                    'joined' => $academy->created_at->format('Y-m-d'),
                    'plan_type' => $academy->plan_type,
                    'plan_max_students' => $academy->plan_max_students ?? 0,
                    'plan_expires_at' => $academy->plan_expires_at?->format('Y-m-d'),
                    'is_unlimited_students' => (bool) $academy->is_unlimited_students,
                    'subscription_fee' => (float) ($academy->subscription_fee ?? 0),
                    'paid_amount' => (float) ($academy->paid_amount ?? 0),
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
     * Get report data for a specific teacher using DTOs and subscription_fee
     */
    public function getTeacherReport(Teacher $teacher, Carbon $startDate, Carbon $endDate): TeacherReportData
    {
        $endDate = $endDate->copy()->endOfDay();
        $pricePerStudent = \App\Domains\Support\Services\HelperService::getPricePerStudent();

        // Eager load relationships to prevent N+1
        $teacher->load(['secretaries', 'enrollments.grade', 'enrollments.group', 'subscriptions']);

        // Students data
        $totalStudents = $teacher->enrollments->count();
        $activeStudents = $teacher->enrollments->where('is_active', true)->count();

        // Total months paid in period from PaymentLog (student payments)
        $billableMonths = PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('months');

        // Secretaries
        $totalSecretaries = $teacher->secretaries->count();

        // === PAYMENT DATA FROM ALL SOURCES ===

        // Source 1: Teacher model's paid_amount field
        $teacherPaidAmount = (float) ($teacher->paid_amount ?? 0);

        // Source 2: PaymentLog (student-to-teacher payments)
        $paymentLogPayments = (float) PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('amount');

        // Source 3: TeacherSubscription records (teacher-to-platform monthly subscriptions)
        $subscriptionsPaid = (float) \App\Domains\Auth\Models\TeacherSubscription::where('teacher_id', $teacher->id)
            ->sum('amount_paid');
        $subscriptionsDue = (float) \App\Domains\Auth\Models\TeacherSubscription::where('teacher_id', $teacher->id)
            ->sum('amount_due');
        $paidSubscriptionsCount = \App\Domains\Auth\Models\TeacherSubscription::where('teacher_id', $teacher->id)
            ->where('amount_paid', '>', 0)
            ->count();

        // Last paid subscription
        $lastPaidSubscription = \App\Domains\Auth\Models\TeacherSubscription::where('teacher_id', $teacher->id)
            ->where('amount_paid', '>', 0)
            ->orderBy('month', 'desc')
            ->first();

        // Use the maximum from all payment sources as confirmed payments
        $confirmedPayments = max($teacherPaidAmount, $paymentLogPayments, $subscriptionsPaid);

        // Effective paid amount (considering all sources)
        $effectivePaidAmount = max($teacherPaidAmount, $subscriptionsPaid);

        // Pending payments
        $pendingPayments = PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->sum('amount');

        // Last payment date - check PaymentLog first, then subscriptions
        $lastPayment = PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->orderBy('confirmed_at', 'desc')
            ->first();
        $lastPaymentDate = $lastPayment ? $lastPayment->confirmed_at->format('Y-m-d') : null;

        // If no PaymentLog, use last paid subscription date
        if (!$lastPaymentDate && $lastPaidSubscription) {
            $lastPaymentDate = $lastPaidSubscription->updated_at?->format('Y-m-d')
                ?? $lastPaidSubscription->month->format('Y-m-d');
        }

        // First payment date (subscription start)
        $firstPayment = PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->orderBy('confirmed_at', 'asc')
            ->first();
        $subscriptionStartDate = $firstPayment ? $firstPayment->confirmed_at->format('Y-m-d') : null;

        // If no PaymentLog, use first subscription
        if (!$subscriptionStartDate) {
            $firstSubscription = \App\Domains\Auth\Models\TeacherSubscription::where('teacher_id', $teacher->id)
                ->orderBy('month', 'asc')
                ->first();
            if ($firstSubscription) {
                $subscriptionStartDate = $firstSubscription->month->format('Y-m-d');
            }
        }

        // Paying students count (unique students who paid in this period)
        $payingStudentsCount = PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->distinct('student_id')
            ->count('student_id');

        // Calculate subscription_fee from teacher's plan if available
        $subscriptionFee = (float) $teacher->subscription_fee;

        // If no subscription_fee set, try subscriptionsDue, then calculate from billable months
        if ($subscriptionFee <= 0 && $subscriptionsDue > 0) {
            $subscriptionFee = $subscriptionsDue;
        }
        if ($subscriptionFee <= 0 && $billableMonths > 0) {
            $subscriptionFee = $billableMonths * $pricePerStudent;
        }

        // Calculate paid months
        $paidMonths = 0;
        // From plan duration
        if ($teacher->plan_expires_at && $teacher->created_at) {
            $paidMonths = (int) ceil($teacher->created_at->diffInMonths($teacher->plan_expires_at));
        }
        // From subscription records
        if ($paidMonths <= 0 && $paidSubscriptionsCount > 0) {
            $paidMonths = $paidSubscriptionsCount;
        }
        // From PaymentLog
        if ($paidMonths <= 0 && $billableMonths > 0) {
            $paidMonths = (int) $billableMonths;
        }

        // Monthly subscription breakdown
        $subscriptionData = $this->getMonthlySubscriptions($teacher, $startDate, $endDate, $pricePerStudent);

        // Calculate totals from subscriptions
        $totalDue = array_sum(array_column($subscriptionData, 'amount_due'));
        $totalPaid = array_sum(array_column($subscriptionData, 'amount_paid'));

        // Use subscription_fee as primary metric
        $totalDue = max($subscriptionFee, $totalDue);

        // Determine payment status using effective paid amount
        $paymentStatus = $this->calculatePaymentStatus($subscriptionFee, $effectivePaidAmount);

        // Monthly breakdown
        $monthlyData = $this->getMonthlyBreakdown($teacher->id, $startDate, $endDate, 'teacher');

        $period = new ReportPeriodData(
            startDate: $startDate,
            endDate: $endDate,
            durationMonths: (int) $startDate->diffInMonths($endDate) + 1
        );

        $summary = new TeacherReportSummaryData(
            totalStudents: $totalStudents,
            activeStudents: $activeStudents,
            newEnrollments: $paidMonths,
            totalSecretaries: $totalSecretaries,
            confirmedPayments: $confirmedPayments,
            payingStudentsCount: $payingStudentsCount,
            pricePerStudent: $pricePerStudent,
            subscriptionFee: $subscriptionFee,
        );

        $financialDetails = [
            'total_revenue' => round($subscriptionFee, 2),
            'total_confirmed_payments' => round($confirmedPayments, 2),
            'price_per_student' => $pricePerStudent,
        ];

        // Calculate subscription expiry from plan_expires_at or from last payment
        $subscriptionExpiry = null;
        if ($teacher->plan_expires_at) {
            $subscriptionExpiry = $teacher->plan_expires_at->format('Y-m-d');
        } elseif ($lastPaymentDate && $lastPayment) {
            $subscriptionExpiry = $lastPayment->confirmed_at->copy()->addMonth()->format('Y-m-d');
        }

        // Check if teacher has subscription
        $hasSubscription = (float) $teacher->subscription_fee > 0
            || $effectivePaidAmount > 0
            || $subscriptionStartDate !== null
            || $paidSubscriptionsCount > 0;

        // Calculate remaining amount due
        $amountDue = $hasSubscription ? max(0, $subscriptionFee - $effectivePaidAmount) : 0;

        return new TeacherReportData(
            teacher: [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'phone' => $teacher->phone,
                'joined' => $teacher->created_at->format('Y-m-d'),
                'status' => $this->getStatusLabel($teacher->status),
                'total_secretaries' => $totalSecretaries,
                'subscription_start_date' => $subscriptionStartDate,
                'last_payment_date' => $lastPaymentDate,
                'subscription_expiry' => $subscriptionExpiry,
                'has_subscription' => $hasSubscription,
                'amount_due' => $amountDue,
                'paid_amount' => $effectivePaidAmount,
                'plan_type' => $teacher->plan_type,
                'plan_max_students' => $teacher->plan_max_students,
                'is_unlimited_students' => $teacher->is_unlimited_students ?? false,
                'days_remaining' => $teacher->plan_expires_at
                    ? (int) max(0, now()->diffInDays($teacher->plan_expires_at, false))
                    : null,
                'payment_percentage' => $subscriptionFee > 0
                    ? min(100, round(($effectivePaidAmount / $subscriptionFee) * 100, 1))
                    : ($hasSubscription ? 100 : 0),
                'plan_duration_months' => $paidMonths,
                'member_since_days' => (int) $teacher->created_at->diffInDays(now()),
            ],
            period: $period,
            summary: $summary,
            financialDetails: $financialDetails,
            monthlyBreakdown: $monthlyData,
            subscriptionBreakdown: $subscriptionData,
            generatedAt: now()->format('Y-m-d H:i:s')
        );
    }

    /**
     * Get report data for a specific academy using DTOs and subscription_fee
     */
    public function getAcademyReport(Academy $academy, Carbon $startDate, Carbon $endDate): array
    {
        $endDate = $endDate->copy()->endOfDay();
        $academyStudentPrice = \App\Domains\Support\Services\HelperService::getAcademyStudentPrice();

        // Eager load teachers and their enrollments to prevent N+1
        $academy->load(['teachers.enrollments.grade', 'teachers.enrollments.group']);

        // Teachers data
        $teachers = $academy->teachers;
        $totalTeachers = $teachers->count();
        $activeTeachers = $teachers->where('pivot.is_active', true)->count();

        // Students data (via teachers)
        $totalEnrollments = 0;
        $activeEnrollments = 0;
        $uniqueStudentIds = [];

        foreach ($teachers as $teacher) {
            foreach ($teacher->enrollments as $enrollment) {
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
        $teacherIds = $teachers->pluck('id')->toArray();

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

        // Use subscription_fee from academy as primary metric (Source of Truth)
        $subscriptionFee = (float) $academy->subscription_fee;

        // Calculate confirmed payments from PaymentLog
        $confirmedPayments = PaymentLog::whereIn('teacher_id', $teacherIds)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('amount');

        // === PAYMENT DATA FROM ALL SOURCES ===

        // Source 1: Academy subscriptions table (dedicated tracking)
        $academySubscriptionsPaid = (float) \App\Domains\Auth\Models\AcademySubscription::where('academy_id', $academy->id)
            ->sum('amount_paid');
        $academySubscriptionsDue = (float) \App\Domains\Auth\Models\AcademySubscription::where('academy_id', $academy->id)
            ->sum('amount_due');
        $paidAcademySubscriptionsCount = \App\Domains\Auth\Models\AcademySubscription::where('academy_id', $academy->id)
            ->where('amount_paid', '>', 0)
            ->count();

        // If no subscription_fee set, try from subscriptions table, then from billable months
        if ($subscriptionFee <= 0 && $academySubscriptionsDue > 0) {
            $subscriptionFee = $academySubscriptionsDue;
        }
        if ($subscriptionFee <= 0 && $totalMonthsPaid > 0) {
            $subscriptionFee = $totalMonthsPaid * $academyStudentPrice;
        }

        // Source 2: academy.paid_amount field (set directly when saving plan or manual update)
        $academyDirectPaid = (float) ($academy->paid_amount ?? 0);

        // Use the maximum from all payment sources (AcademySubscription, manual logs, or direct paid_amount)
        $effectivePaidAmount = max((float) $confirmedPayments, $academySubscriptionsPaid, $academyDirectPaid);

        $remainingBalance = max(0, $subscriptionFee - $effectivePaidAmount);
        $paymentStatus = $this->calculatePaymentStatus($subscriptionFee, $effectivePaidAmount);

        // Monthly breakdown
        $monthlyData = $this->getMonthlyBreakdownForAcademy($teacherIds, $startDate, $endDate, $academy);

        $summary = new AcademyReportSummaryData(
            totalTeachers: $totalTeachers,
            activeTeachers: $activeTeachers,
            totalAcademyStudents: $totalAcademyStudents,
            totalEnrollments: $totalEnrollments,
            activeEnrollments: $activeEnrollments,
            totalSubscriptions: (int) $totalMonthsPaid,
            totalPaymentTransactions: $totalPaymentTransactions,
            subscriptionFee: $subscriptionFee,
            confirmedPayments: $effectivePaidAmount,
            remainingBalance: (float) $remainingBalance,
            paymentStatus: $paymentStatus,
            pricePerStudent: $academyStudentPrice
        );

        // Calculate plan duration
        $paidMonths = 0;
        if ($academy->plan_expires_at && $academy->created_at) {
            $paidMonths = (int) ceil($academy->created_at->diffInMonths($academy->plan_expires_at));
        }
        if ($paidMonths <= 0 && $paidAcademySubscriptionsCount > 0) {
            $paidMonths = $paidAcademySubscriptionsCount;
        }
        if ($paidMonths <= 0 && $totalMonthsPaid > 0) {
            $paidMonths = (int) $totalMonthsPaid;
        }

        // Has subscription
        $hasSubscription = (float) $academy->subscription_fee > 0
            || $effectivePaidAmount > 0
            || $totalPaymentTransactions > 0
            || $paidAcademySubscriptionsCount > 0;

        // Subscription expiry
        $subscriptionExpiry = null;
        if ($academy->plan_expires_at) {
            $subscriptionExpiry = $academy->plan_expires_at->format('Y-m-d');
        }

        // Amount due
        $amountDue = $hasSubscription ? max(0, $subscriptionFee - $effectivePaidAmount) : 0;

        return [
            'academy' => [
                'id' => $academy->id,
                'name' => $academy->name,
                'phone' => $academy->phone,
                'joined' => $academy->created_at->format('Y-m-d'),
                'status' => $academy->is_active ? 'نشط' : 'غير نشط',
                'total_teachers' => $totalTeachers,
                'active_teachers' => $activeTeachers,
                'has_subscription' => $hasSubscription,
                'subscription_expiry' => $subscriptionExpiry,
                'amount_due' => $amountDue,
                'paid_amount' => $effectivePaidAmount,
                'plan_type' => $academy->plan_type,
                'plan_max_students' => $academy->plan_max_students,
                'is_unlimited_students' => ($academy->plan_max_students === null || $academy->plan_max_students <= 0),
                'days_remaining' => $academy->plan_expires_at
                    ? (int) max(0, now()->diffInDays($academy->plan_expires_at, false))
                    : null,
                'payment_percentage' => $subscriptionFee > 0
                    ? min(100, round(($effectivePaidAmount / $subscriptionFee) * 100, 1))
                    : ($hasSubscription ? 100 : 0),
                'plan_duration_months' => $paidMonths,
                'member_since_days' => (int) $academy->created_at->diffInDays(now()),
            ],
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'duration_months' => (int) ($startDate->diffInMonths($endDate) + 1),
            ],
            'summary' => $summary->toArray(),
            'monthly_breakdown' => $monthlyData,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get admin overview report using DTOs and subscription_fee
     */
    public function getAdminReport(Carbon $startDate, Carbon $endDate): array
    {
        $endDate = $endDate->copy()->endOfDay();
        $pricePerStudent = \App\Domains\Support\Services\HelperService::getPricePerStudent();
        $academyStudentPrice = \App\Domains\Support\Services\HelperService::getAcademyStudentPrice();

        // 1. Counts with eager loading for efficiency
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

        // 3. Financial Summary Calculation using subscription_fee

        // Calculate total subscription fees from all teachers and academies
        $totalSubscriptionFees = Teacher::sum('subscription_fee') + Academy::sum('subscription_fee');

        // A. Independent Teachers Commission
        $independentCommission = $independentSubscriptions * $pricePerStudent;

        // B. Academy Revenue (Platform Share)
        $academyPlatformShare = $academySubscriptions * $academyStudentPrice;

        // C. Net Platform Profit
        $netPlatformProfit = $independentCommission + $academyPlatformShare;

        // Confirmed payments
        $confirmedPayments = PaymentLog::where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('amount');

        // Teachers breakdown


        // Monthly breakdown
        $monthlyData = $this->getMonthlyBreakdown(null, $startDate, $endDate, 'admin');

        $summary = new AdminReportSummaryData(
            totalAcademies: $totalAcademies,
            independentTeachersCount: $independentTeachersCount,
            totalTeachers: $totalTeachers,
            activeTeachers: $activeTeachers,
            suspendedTeachers: $suspendedTeachers,
            newTeachers: $newTeachers,
            totalStudents: $totalStudents,
            newStudents: $newStudents,
            totalSecretaries: $totalSecretaries,
            totalEnrollments: $totalEnrollments,
            activeEnrollments: $activeEnrollments,
            newEnrollments: $newEnrollments,
            totalSubscriptions: (int) $totalSubscriptions,
            academySubscriptions: (int) $academySubscriptions,
            independentSubscriptions: (int) $independentSubscriptions,
            totalSubscriptionFees: (float) $totalSubscriptionFees,
            confirmedPayments: (float) $confirmedPayments,
            independentCommission: (float) $independentCommission,
            academyPlatformShare: (float) $academyPlatformShare,
            netPlatformProfit: (float) $netPlatformProfit,
            pricePerStudent: $pricePerStudent,
            academyStudentPrice: $academyStudentPrice
        );

        return [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'duration_months' => (int) ($startDate->diffInMonths($endDate) + 1),
            ],
            'summary' => $summary->toArray(),
            'teachers_breakdown' => [],
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

        // Get subscription fees per teacher
        $subscriptionFeesByTeacher = Teacher::pluck('subscription_fee', 'id');

        return Teacher::select('id', 'name', 'status', 'created_at')
            ->withCount([
                'enrollments as total_students',
                'enrollments as active_students' => fn($q) => $q->where('is_active', true),
                'secretaries'
            ])
            ->get()
            ->map(function ($teacher) use ($pricePerStudent, $paymentsByTeacher, $monthsByTeacher, $subscriptionFeesByTeacher) {
                $teacherMonths = $monthsByTeacher[$teacher->id] ?? 0;
                $subscriptionFee = (float) ($subscriptionFeesByTeacher[$teacher->id] ?? 0);

                // Use subscription_fee if available, otherwise calculate from months
                $revenue = $subscriptionFee > 0
                    ? $subscriptionFee
                    : (float) ($teacherMonths * $pricePerStudent);

                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'status' => $this->getStatusLabel($teacher->status),
                    'total_students' => (int) $teacher->total_students,
                    'active_students' => (int) $teacher->active_students,
                    'secretaries' => (int) $teacher->secretaries_count,
                    'subscriptions' => (int) $teacherMonths,
                    'subscription_fee' => $subscriptionFee,
                    'revenue' => $revenue,
                    'paid' => (float) ($paymentsByTeacher[$teacher->id] ?? 0),
                    'joined' => $teacher->created_at->format('Y-m-d'),
                ];
            })->toArray();
    }

    /**
     * Get monthly breakdown for academy (list of teachers)
     * NOW SAME AS TEACHER: Uses AcademySubscription as Source of Truth
     */
    private function getMonthlyBreakdownForAcademy(array $teacherIds, Carbon $startDate, Carbon $endDate, ?Academy $academy = null): array
    {
        $months = [];
        $currentMonth = $startDate->copy()->startOfMonth();
        $lastMonth = $endDate->copy()->startOfMonth();
        $academyStudentPrice = \App\Domains\Support\Services\HelperService::getAcademyStudentPrice();

        while ($currentMonth <= $lastMonth) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();

            $queryStart = $monthStart->lt($startDate) ? $startDate->copy()->startOfDay() : $monthStart;
            $queryEnd = $monthEnd->gt($endDate) ? $endDate->copy()->endOfDay() : $monthEnd->endOfDay();

            $newEnrollments = Enrollment::whereIn('teacher_id', $teacherIds)
                ->whereBetween('created_at', [$queryStart, $queryEnd])
                ->count();

            // Source of Truth: AcademySubscription record
            if ($academy) {
                $subscription = AcademySubscription::where('academy_id', $academy->id)
                    ->where('month', $monthStart->format('Y-m-d'))
                    ->first();
            } else {
                $subscription = null;
            }

            if ($subscription) {
                $studentCount = $subscription->student_count;
                $amountDue = $subscription->amount_due;
                $amountPaid = $subscription->amount_paid;
                $status = $subscription->status->value ?? 'pending';
            } else {
                // Fallback: Calculate on the fly (Seat System)
                $query = Enrollment::whereIn('teacher_id', $teacherIds)
                    ->withTrashed()
                    ->where('created_at', '<=', $monthEnd)
                    ->where(function($q) use ($monthStart) {
                        $q->whereNull('deleted_at')
                          ->orWhere('deleted_at', '>=', $monthStart);
                    });

                $studentCount = $query->count();
                $amountDue = $studentCount * $academyStudentPrice;
                $amountPaid = 0;
                $status = 'pending';
            }

            $months[] = [
                'month' => $currentMonth->format('Y-m'),
                'month_name' => \App\Domains\Support\Services\HelperService::getArabicMonthName($currentMonth->month) . ' ' . $currentMonth->year,
                'new_enrollments' => $newEnrollments,
                'student_count' => (int) $studentCount,
                'amount_due' => (float) $amountDue,
                'amount_paid' => (float) $amountPaid,
                'amount_remaining' => (float) ($amountDue - $amountPaid),
                'status' => $status,
                'status_label' => $this->getStatusLabel($status),
                'confirmed_payments' => 0,
            ];

            $currentMonth->addMonth();
        }

        return $months;
    }

    /**
     * Get monthly subscriptions breakdown
     */
    private function getMonthlySubscriptions(Teacher $teacher, Carbon $startDate, Carbon $endDate, float $pricePerStudent): array
    {
        $months = [];
        $currentMonth = $startDate->copy()->startOfMonth();
        $lastMonth = $endDate->copy()->startOfMonth();

        // Get teacher_student_price from settings (Unified)
        $teacherStudentPrice = \App\Domains\Support\Services\HelperService::getPricePerStudent();

        while ($currentMonth <= $lastMonth) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();

            // Try to find existing subscription record first (Source of Truth)
            $subscription = TeacherSubscription::where('teacher_id', $teacher->id)
                ->where('month', $monthStart->format('Y-m-d'))
                ->first();

            if ($subscription) {
                $totalMonthsPaidInMonth = $subscription->student_count;
                $amountDue = $subscription->amount_due;
                $amountPaid = $subscription->amount_paid;
                $status = $subscription->status;
            } else {
                // Fallback: Calculate on the fly (Potential Revenue - Seat System)
                $query = Enrollment::where('teacher_id', $teacher->id)
                    ->withTrashed()
                    ->where('created_at', '<=', $monthEnd)
                    ->where(function($q) use ($monthStart) {
                        $q->whereNull('deleted_at')
                          ->orWhere('deleted_at', '>=', $monthStart);
                    });

                $totalMonthsPaidInMonth = $query->count();

                $amountDue = $totalMonthsPaidInMonth * $teacherStudentPrice;
                $amountPaid = 0;
                $status = 'pending';
            }

            $months[] = [
                'month' => $currentMonth->format('Y-m'),
                'month_name' => \App\Domains\Support\Services\HelperService::getArabicMonthName($currentMonth->month) . ' ' . $currentMonth->year,
                'student_count' => (int) $totalMonthsPaidInMonth,
                'amount_due' => (float) $amountDue,
                'amount_paid' => (float) $amountPaid,
                'amount_remaining' => (float) ($amountDue - $amountPaid),
                'status' => $status,
                'status_label' => $this->getStatusLabel($status),
            ];

            $currentMonth->addMonth();
        }

        return $months;
    }

    /**
     * Get monthly breakdown of enrollments and payments
     */
    private function getMonthlyBreakdown(?string $teacherId, Carbon $startDate, Carbon $endDate, string $type): array
    {
        $months = [];

        $currentMonth = $startDate->copy()->startOfMonth();
        $lastMonth = $endDate->copy()->startOfMonth();

        while ($currentMonth <= $lastMonth) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();

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
                'month_name' => \App\Domains\Support\Services\HelperService::getArabicMonthName($currentMonth->month) . ' ' . $currentMonth->year,
                'new_enrollments' => $newEnrollments,
                'confirmed_payments' => (float) $payments,
            ];

            $currentMonth->addMonth();
        }

        return $months;
    }

    /**
     * Get status label in Arabic
     */
    private function getStatusLabel(string|\BackedEnum $status): string
    {
        $statusValue = $status instanceof \BackedEnum ? $status->value : $status;
        return match($statusValue) {
            'active' => 'نشط',
            'suspended' => 'معلق',
            'pending' => 'في انتظار الموافقة',
            'paid' => 'مدفوع',
            'partial' => 'مدفوع جزئياً',
            'unpaid' => 'غير مدفوع',
            default => $statusValue,
        };
    }

    /**
     * Calculate payment status based on amounts
     */
    private function calculatePaymentStatus(float $totalDue, float $totalPaid): string
    {
        if ($totalDue <= 0) {
            return 'unpaid';
        }

        if ($totalPaid >= $totalDue) {
            return 'paid';
        }

        if ($totalPaid > 0) {
            return 'partial';
        }

        return 'unpaid';
    }
}
