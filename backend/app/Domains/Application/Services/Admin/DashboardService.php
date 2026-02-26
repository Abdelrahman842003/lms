<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Admin;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Support\Services\CacheService;

class DashboardService
{
    public function getStats(): array
    {
        return CacheService::getAdminDashboardStats(function () {
        $settingValue = \App\Domains\Support\Models\Setting::where('key', 'pricePerStudent')->value('value');
        $pricePerStudent = is_numeric($settingValue) ? (float) $settingValue : 0;
        
        // Calculate total students across all teachers (sum of each teacher's students)
        $totalStudentsAcrossTeachers = Teacher::withCount('students')
            ->get()
            ->sum('students_count');
        
        return [
            'teachers_count' => Teacher::count(),
            'pending_teachers_count' => Teacher::where('status', 'pending')->count(),
            'students_count' => Student::count(),
            'secretaries_count' => Secretary::count(),
            'total_revenue' => $totalStudentsAcrossTeachers * $pricePerStudent,
            'active_enrollments_count' => $totalStudentsAcrossTeachers,
            'price_per_student' => $pricePerStudent,
        ];
        });
    }

    /**
     * Clear admin dashboard cache
     * Call this when stats change
     */
    public function clearStatsCache(): void
    {
        CacheService::forgetAdminDashboard();
    }
}
