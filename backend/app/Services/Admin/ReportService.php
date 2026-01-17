<?php

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
        $pricePerStudent = \App\Services\HelperService::getPricePerStudent();

        // Students data
        $enrollmentsQuery = Enrollment::where('teacher_id', $teacher->id);
        $totalStudents = (clone $enrollmentsQuery)->count();
        $activeStudents = (clone $enrollmentsQuery)->where('is_active', true)->count();
        
        // New enrollments in period
        $newEnrollments = Enrollment::where('teacher_id', $teacher->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

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

        // Calculated revenue based on total enrolled students
        $calculatedRevenue = $totalStudents * $pricePerStudent;

        // Monthly breakdown
        $monthlyData = $this->getMonthlyBreakdown($teacher->id, $startDate, $endDate, 'teacher');

        // Monthly subscription breakdown
        $subscriptionData = $this->getMonthlySubscriptions($teacher, $startDate, $endDate, $pricePerStudent);

        // Calculate totals from subscriptions
        $totalDue = array_sum(array_column($subscriptionData, 'amount_due'));
        $totalPaid = array_sum(array_column($subscriptionData, 'amount_paid'));
        $totalRemaining = $totalDue - $totalPaid;

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
                'new_enrollments' => $newEnrollments,
                'total_secretaries' => $totalSecretaries,
                'confirmed_payments' => (float) $confirmedPayments,
                'pending_payments' => (float) $pendingPayments,
                'calculated_revenue' => $calculatedRevenue,
                'price_per_student' => $pricePerStudent,
                'total_due' => $totalDue,
                'total_paid' => $totalPaid,
                'total_remaining' => $totalRemaining,
                'paying_students_count' => $payingStudentsCount,
                'not_paying_students_count' => $totalStudents - $payingStudentsCount,
            ],
            'monthly_breakdown' => $monthlyData,
            'subscription_breakdown' => $subscriptionData,
            'student_account_breakdown' => $this->getStudentAccountBreakdown($teacher, $startDate, $endDate),
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get report data for a specific academy
     */
    public function getAcademyReport(Academy $academy, Carbon $startDate, Carbon $endDate): array
    {
        $pricePerStudent = \App\Services\HelperService::getAcademyStudentPrice();

        // Teachers data
        $teachersQuery = $academy->teachers();
        $totalTeachers = (clone $teachersQuery)->count();
        $activeTeachers = (clone $teachersQuery)->wherePivot('is_active', true)->count();

        // Students data (via teachers)
        // Since we don't have a direct relationship, we iterate over teachers
        $academyTeachers = $academy->teachers()->with('enrollments')->get();
        
        $totalEnrollments = 0;
        $activeEnrollments = 0;
        $uniqueStudentIds = [];

        foreach ($academyTeachers as $teacher) {
            foreach ($teacher->enrollments as $enrollment) {
                $totalEnrollments++;
                if ($enrollment->is_active) {
                    $activeEnrollments++;
                }
                $uniqueStudentIds[] = $enrollment->student_id;
            }
        }
        
        $totalAcademyStudents = count(array_unique($uniqueStudentIds));

        // Calculate expected revenue (Total Enrollments * Price Per Student)
        // Note: This is platform revenue from this academy's students
        $expectedRevenue = $totalEnrollments * $pricePerStudent;

        // Confirmed payments in period (from academy's teachers)
        $confirmedPayments = PaymentLog::whereIn('teacher_id', $academyTeachers->pluck('id'))
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('amount');

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
                'expected_revenue' => $expectedRevenue,
                'confirmed_payments' => (float) $confirmedPayments,
                'remaining_balance' => $expectedRevenue - $confirmedPayments,
                'payment_status' => $confirmedPayments == 0 ? 'لم يدفع' : ($expectedRevenue - $confirmedPayments <= 0 ? 'مدفوع' : 'متبقي دفعات'),
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
                
            $payments = PaymentLog::whereIn('teacher_id', $teacherIds)
                ->where('status', 'confirmed')
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
    private function getMonthlySubscriptions(Teacher $teacher, Carbon $startDate, Carbon $endDate, float $pricePerStudent): array
    {
        $months = [];
        $currentMonth = $startDate->copy()->startOfMonth();
        $lastMonth = $endDate->copy()->startOfMonth();
        
        while ($currentMonth <= $lastMonth) {
            $monthDate = $currentMonth->format('Y-m-d');
            $monthEnd = $currentMonth->copy()->endOfMonth();
            
            // Get or create subscription for this month
            $subscription = TeacherSubscription::firstOrCreate(
                [
                    'teacher_id' => $teacher->id,
                    'month' => $monthDate,
                ],
                [
                    'student_count' => $teacher->students()
                        ->wherePivot('created_at', '<=', $monthEnd)
                        ->count(),
                    'amount_due' => $teacher->students()
                        ->wherePivot('created_at', '<=', $monthEnd)
                        ->count() * $pricePerStudent,
                    'amount_paid' => 0,
                    'status' => 'pending'
                ]
            );

            // Refresh calculation for pending subscriptions
            if ($subscription->status === 'pending') {
                $studentCount = $teacher->students()
                    ->wherePivot('created_at', '<=', $monthEnd)
                    ->count();
                $amountDue = $studentCount * $pricePerStudent;
                
                if ($subscription->student_count !== $studentCount || $subscription->amount_due != $amountDue) {
                    $subscription->student_count = $studentCount;
                    $subscription->amount_due = $amountDue;
                    $subscription->save();
                }
            }

            $amountRemaining = $subscription->amount_due - $subscription->amount_paid;

            $months[] = [
                'month' => $currentMonth->format('Y-m'),
                'month_name' => \App\Services\HelperService::getArabicMonthName($currentMonth->month) . ' ' . $currentMonth->year,
                'student_count' => $subscription->student_count,
                'amount_due' => (float) $subscription->amount_due,
                'amount_paid' => (float) $subscription->amount_paid,
                'amount_remaining' => (float) max(0, $amountRemaining),
                'status' => $subscription->status,
                'status_label' => \App\Services\HelperService::getStatusLabel($subscription->status),
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
        $pricePerStudent = \App\Services\HelperService::getPricePerStudent();

        // Overall counts
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

        // Payments in period
        $confirmedPayments = PaymentLog::where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->sum('amount');

        // Total calculated revenue
        $totalRevenue = $activeEnrollments * $pricePerStudent;

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
                'confirmed_payments' => (float) $confirmedPayments,
                'total_revenue' => $totalRevenue,
                'price_per_student' => $pricePerStudent,
            ],
            'teachers_breakdown' => $teachersBreakdown,
            'monthly_breakdown' => $monthlyData,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get teachers breakdown for admin report
     */
    private function getTeachersBreakdown(float $pricePerStudent, Carbon $startDate, Carbon $endDate): array
    {
        return Teacher::all()->map(function ($teacher) use ($pricePerStudent, $startDate, $endDate) {
            $enrollments = Enrollment::where('teacher_id', $teacher->id);
            $totalStudents = (clone $enrollments)->count();
            $activeStudents = (clone $enrollments)->where('is_active', true)->count();
            $secretariesCount = Secretary::where('teacher_id', $teacher->id)->count();

            return [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'status' => match($teacher->status) {
                    'active' => 'نشط',
                    'suspended' => 'معلق',
                    'pending' => 'في انتظار الموافقة',
                    default => 'غير معروف'
                },
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'secretaries' => $secretariesCount,
                'revenue' => $activeStudents * $pricePerStudent,
                'paid' => PaymentLog::where('teacher_id', $teacher->id)
                    ->where('status', 'confirmed')
                    ->whereBetween('confirmed_at', [$startDate, $endDate])
                    ->sum('amount'),
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
