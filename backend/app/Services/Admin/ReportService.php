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
use Illuminate\Support\Collection;

class ReportService
{
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
                'status' => $teacher->is_suspended ? 'معلق' : 'نشط',
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
     * Get monthly subscription details for teacher
     */
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
     * Get detailed monthly subscription status for each student
     */
    public function getStudentMonthlySubscriptionDetails(Teacher $teacher, Carbon $startDate, Carbon $endDate): array
    {
        $details = [];
        $currentMonth = $startDate->copy()->startOfMonth();
        $lastMonth = $endDate->copy()->startOfMonth();
        
        while ($currentMonth <= $lastMonth) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();
            
            // Adjust to actual date range for payments
            $queryStart = $monthStart->lt($startDate) ? $startDate->copy()->startOfDay() : $monthStart;
            $queryEnd = $monthEnd->gt($endDate) ? $endDate->copy()->endOfDay() : $monthEnd->endOfDay();

            // Get active enrollments for this month
            $enrollments = \App\Models\Enrollment::where('teacher_id', $teacher->id)
                ->withTrashed()
                ->where('created_at', '<=', $monthEnd)
                ->where(function($q) use ($monthStart) {
                    $q->whereNull('deleted_at')
                      ->orWhere('deleted_at', '>=', $monthStart);
                })
                ->with(['student' => function($q) {
                    $q->withTrashed();
                }, 'group', 'grade'])
                ->get();

            foreach ($enrollments as $enrollment) {
                if (!$enrollment->student) continue;

                $price = 0;
                if ($enrollment->group && $enrollment->group->price) {
                    $price = $enrollment->group->price;
                } elseif ($enrollment->grade && $enrollment->grade->price) {
                    $price = $enrollment->grade->price;
                }

                $amountPaid = \App\Models\PaymentLog::where('teacher_id', $teacher->id)
                    ->where('student_id', $enrollment->student_id)
                    ->where('status', 'confirmed')
                    ->whereBetween('confirmed_at', [$queryStart, $queryEnd])
                    ->sum('amount');

                $amountRemaining = $price - $amountPaid;

                $status = 'pending';
                if ($amountRemaining <= 0 && $amountPaid > 0) {
                    $status = 'paid';
                } elseif ($amountPaid > 0) {
                    $status = 'partial';
                }

                $details[] = [
                    'month' => $currentMonth->format('Y-m'),
                    'month_name' => \App\Services\HelperService::getArabicMonthName($currentMonth->month) . ' ' . $currentMonth->year,
                    'student_name' => $enrollment->student->name,
                    'student_phone' => $enrollment->student->phone,
                    'amount_due' => (float) $price,
                    'amount_paid' => (float) $amountPaid,
                    'amount_remaining' => (float) max(0, $amountRemaining),
                    'status' => $status,
                    'status_label' => \App\Services\HelperService::getStatusLabel($status),
                ];
            }

            $currentMonth->addMonth();
        }
        
        return $details;
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
        $activeTeachers = Teacher::where('is_suspended', false)->count();
        $suspendedTeachers = Teacher::where('is_suspended', true)->count();
        
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
                'status' => $teacher->is_suspended ? 'معلق' : 'نشط',
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
