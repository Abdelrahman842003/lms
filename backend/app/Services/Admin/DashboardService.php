<?php

namespace App\Services\Admin;

use App\Models\Teacher;
use App\Models\Student;
use App\Models\Secretary;

class DashboardService
{
    public function getStats(): array
    {
        return [
            'teachers_count' => Teacher::count(),
            'students_count' => Student::count(),
            'secretaries_count' => Secretary::count(),
        ];
    }
}
