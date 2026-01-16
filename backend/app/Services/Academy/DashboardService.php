<?php

declare(strict_types=1);

namespace App\Services\Academy;

use App\Models\Academy;
use App\Models\TeacherAttendanceLog;
use Carbon\Carbon;

class DashboardService
{
    public function getStats(Academy $academy): array
    {
        // Get active teachers count
        $activeTeachersCount = $academy->activeTeachers()->count();
        
        // Get active secretaries count
        $activeSecretariesCount = $academy->activeSecretaries()->count();

        // Get total enrollments (links) and unique students
        $totalEnrollments = 0;
        $uniqueStudentIds = collect();
        
        foreach ($academy->activeTeachers as $teacher) {
            $enrollments = $teacher->activeEnrollments()->with('student')->get();
            $totalEnrollments += $enrollments->count();
            $uniqueStudentIds = $uniqueStudentIds->merge($enrollments->pluck('student_id'));
        }
        
        $uniqueStudentsCount = $uniqueStudentIds->unique()->count();

        // Get today's attendance
        $today = Carbon::today();
        $todayAttendance = TeacherAttendanceLog::forAcademy($academy->id)
            ->whereDate('date', $today)
            ->get();

        $checkedInToday = $todayAttendance->where('status', 'checked_in')->count();
        $checkedOutToday = $todayAttendance->where('status', 'checked_out')->count();

        // Get this month's attendance stats
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();
        
        $monthlyAttendance = TeacherAttendanceLog::forAcademy($academy->id)
            ->dateRange($startOfMonth, $endOfMonth)
            ->get();

        $monthlyPresent = $monthlyAttendance->where('status', 'checked_out')->count();
        $monthlyAbsent = $monthlyAttendance->where('status', 'absent')->count();

        // --- Revenue Statistics ---
        // Only get IDs of active teachers
        $teacherIds = $academy->activeTeachers()->pluck('teachers.id');
        
        // Current Month Revenue
        $currentMonthRevenue = \App\Models\PaymentLog::whereIn('teacher_id', $teacherIds)
            ->confirmed()
            ->whereBetween('confirmed_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // Historical Revenue (Last 6 months)
        $revenueChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();
            
            $revenue = \App\Models\PaymentLog::whereIn('teacher_id', $teacherIds)
                ->confirmed()
                ->whereBetween('confirmed_at', [$monthStart, $monthEnd])
                ->sum('amount');
                
            $revenueChart[] = [
                'month' => $date->format('M'), // e.g., Jan
                'full_date' => $date->format('Y-m'),
                'revenue' => $revenue,
                'label' => $date->translatedFormat('F'), // Arabic month name if locale set
            ];
        }

        // Get pending billing
        $pendingBilling = $academy->billings()
            ->pending()
            ->latest()
            ->first();
        
        // Get recent teachers (last 5) - only active teachers
        $recentTeachers = $academy->teachers()
            ->where('academy_teacher.is_active', true)
            ->where('teachers.status', 'active')
            ->orderBy('academy_teacher.created_at', 'desc')
            ->limit(5)
            ->get();

        // Transform recent teachers
        $transformedTeachers = $recentTeachers->map(function ($teacher) {
            return [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'avatar' => $teacher->avatar_url,
                'students_count' => $teacher->activeEnrollments()->count(),
                'status' => $teacher->pivot->is_active ? 'نشط' : 'غير نشط',
                'created_at' => $teacher->pivot->created_at,
            ];
        });

        return [
            'academy' => [
                'id' => $academy->id,
                'name' => $academy->name,
                'logo_key' => $academy->logo_key,
            ],
            'teachers_count' => $activeTeachersCount,
            'students_count' => $uniqueStudentsCount,
            'total_enrollments' => $totalEnrollments,
            'actual_revenue' => $currentMonthRevenue,
            'revenue_chart' => $revenueChart,
            'teachers' => $transformedTeachers,
            'stats' => [
                'active_teachers' => $activeTeachersCount,
                'active_secretaries' => $activeSecretariesCount,
                'total_students' => $uniqueStudentsCount,
                'total_enrollments' => $totalEnrollments,
                'checked_in_today' => $checkedInToday,
                'checked_out_today' => $checkedOutToday,
                'monthly_present' => $monthlyPresent,
                'monthly_absent' => $monthlyAbsent,
            ],
            'pending_billing' => $pendingBilling ? [
                'month' => $pendingBilling->month,
                'year' => $pendingBilling->year,
                'total_cost' => $pendingBilling->total_cost,
            ] : null,
        ];
    }
}
