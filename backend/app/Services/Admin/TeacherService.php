<?php

namespace App\Services\Admin;

use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TeacherService
{
    public function getTeachers(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        return Teacher::withCount(['students', 'secretaries'])
            ->latest()
            ->filter($filters)
            ->paginate($perPage);
    }

    public function toggleStatus(string $teacherId): Teacher
    {
        $teacher = Teacher::findOrFail($teacherId);
        \Illuminate\Support\Facades\Log::info("Toggling status for teacher {$teacherId}. Current status: " . ($teacher->is_suspended ? 'Suspended' : 'Active'));
        
        $teacher->is_suspended = ! $teacher->is_suspended;
        $teacher->save();
        
        \Illuminate\Support\Facades\Log::info("New status for teacher {$teacherId}: " . ($teacher->is_suspended ? 'Suspended' : 'Active'));
        
        return $teacher;
    }
}
