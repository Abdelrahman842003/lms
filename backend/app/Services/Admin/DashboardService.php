<?php

namespace App\Services\Admin;

use App\Models\Teacher;
use App\Models\Student;
use App\Models\Secretary;

class DashboardService
{
    public function getStats(): array
    {
        $settingValue = \App\Models\Setting::where('key', 'pricePerStudent')->value('value');
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
    }
}
