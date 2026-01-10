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

        // Get total students across all teachers
        $totalStudents = 0;
        foreach ($academy->activeTeachers as $teacher) {
            $totalStudents += $teacher->activeEnrollments()->count();
        }

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

        // Get pending billing
        $pendingBilling = $academy->billings()
            ->pending()
            ->latest()
            ->first();
        
        // Get recent teachers (last 5)
        $recentTeachers = $academy->teachers()
            ->orderBy('academy_teacher.created_at', 'desc')
            ->limit(5)
            ->get();

        // Transform recent teachers
        $transformedTeachers = $recentTeachers->map(function ($teacher) {
            return [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'avatar' => $teacher->avatar_url, // Assuming accessor exists or null
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
            'students_count' => $totalStudents,
            'total_revenue' => 0, // Placeholder as logic is not clear yet
            'teachers' => $transformedTeachers,
            'stats' => [ // Keep original stats just in case
                'active_teachers' => $activeTeachersCount,
                'active_secretaries' => $activeSecretariesCount,
                'total_students' => $totalStudents,
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
