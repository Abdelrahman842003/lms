<?php

declare(strict_types=1);

namespace App\Services\Academy;

use App\Models\Academy;
use App\Models\Teacher;
use App\Models\TeacherAttendanceLog;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

class TeacherService
{
    /**
     * Get paginated teachers for academy
     */
    public function getTeachers(Academy $academy, int $perPage, ?string $search = null): LengthAwarePaginator
    {
        return $academy->teachers()
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
            })
            ->withPivot('is_active', 'joined_at')
            ->paginate($perPage);
    }

    /**
     * Add teacher to academy
     */
    public function addTeacher(Academy $academy, string $teacherId): Teacher
    {
        // Check if teacher already exists
        if ($academy->teachers()->where('teacher_id', $teacherId)->exists()) {
            throw new \Exception('المدرس موجود بالفعل في الأكاديمية');
        }

        $academy->teachers()->attach($teacherId, [
            'is_active' => true,
            'joined_at' => Carbon::now(),
        ]);

        return Teacher::findOrFail($teacherId);
    }

    /**
     * Create new teacher and add to academy
     */
    public function createTeacher(Academy $academy, \App\DTOs\Academy\TeacherData $data): Teacher
    {
        // Check if phone exists
        if (Teacher::where('phone', $data->phone)->exists()) {
            throw new \Exception('رقم الهاتف مستخدم بالفعل');
        }

        $teacher = Teacher::create([
            'name' => $data->name,
            'phone' => $data->phone,
            'password' => $data->password,
            'is_suspended' => false,
        ]);

        $academy->teachers()->attach($teacher->id, [
            'is_active' => true,
            'joined_at' => Carbon::now(),
        ]);

        return $teacher;
    }

    /**
     * Get teacher with attendance logs
     */
    public function getTeacherWithLogs(
        Academy $academy,
        string $teacherId,
        string $dateFrom,
        string $dateTo
    ): array {
        $teacher = $academy->teachers()->findOrFail($teacherId);

        $attendanceLogs = TeacherAttendanceLog::forAcademy($academy->id)
            ->forTeacher($teacher->id)
            ->dateRange($dateFrom, $dateTo)
            ->orderBy('date', 'desc')
            ->get();

        // Calculate stats
        $totalPresent = $attendanceLogs->where('status', 'checked_out')->count();
        $totalAbsent = $attendanceLogs->where('status', 'absent')->count();
        $totalDuration = $attendanceLogs->sum('duration_minutes');

        return [
            'teacher' => $teacher,
            'attendance_logs' => $attendanceLogs,
            'stats' => [
                'total_present' => $totalPresent,
                'total_absent' => $totalAbsent,
                'total_duration_minutes' => $totalDuration,
                'total_duration_formatted' => sprintf('%dh %dm', floor($totalDuration / 60), $totalDuration % 60),
            ],
        ];
    }

    /**
     * Toggle teacher status
     */
    public function toggleStatus(Academy $academy, string $teacherId): bool
    {
        $teacher = $academy->teachers()->findOrFail($teacherId);
        $currentStatus = $teacher->pivot->is_active;

        $academy->teachers()->updateExistingPivot($teacherId, [
            'is_active' => !$currentStatus,
        ]);

        return !$currentStatus;
    }

    /**
     * Remove teacher from academy
     */
    public function removeTeacher(Academy $academy, string $teacherId): void
    {
        $academy->teachers()->detach($teacherId);
    }
}
