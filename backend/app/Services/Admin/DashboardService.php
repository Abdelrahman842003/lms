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
        $activeEnrollmentsCount = \App\Models\Enrollment::where('is_active', true)->count();

        return [
            'teachers_count' => Teacher::count(),
            'students_count' => Student::count(),
            'secretaries_count' => Secretary::count(),
            'total_revenue' => Student::count() * $pricePerStudent,
            'active_enrollments_count' => Student::count(), // Using student count as requested
            'price_per_student' => $pricePerStudent,
        ];
    }
}
