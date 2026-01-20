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
    public function getTeachers(Academy $academy, int $perPage, ?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        return $academy->teachers()
            ->select('teachers.*')
            ->when($status, function ($query) use ($status) {
                if ($status === 'active') {
                    $query->where('academy_teacher.is_active', true)
                          ->where('teachers.status', 'active');
                } elseif ($status === 'pending') {
                    $query->where('teachers.status', 'pending');
                } elseif ($status === 'inactive') {
                    $query->where('academy_teacher.is_active', false);
                }
            }, function ($query) {
                // Default: show all teachers linked to academy regardless of status
                // No default filter needed as we want to see all teachers
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('teachers.name', 'like', "%{$search}%")
                      ->orWhere('teachers.phone', 'like', "%{$search}%");
                });
            })
            ->withPivot('is_active', 'joined_at')
            ->paginate($perPage);
    }

    /**
     * Check if teacher exists by phone number
     */
    public function checkTeacherByPhone(string $phone): ?array
    {
        $teacher = Teacher::where('phone', $phone)->first();

        if (!$teacher) {
            return null;
        }

        return [
            'id' => $teacher->id,
            'name' => $teacher->name,
            'phone' => $teacher->phone,
            'is_approved' => $teacher->status !== 'pending',
        ];
    }


    /**
     * Add teacher to academy
     */
    public function addTeacher(Academy $academy, string $teacherId): Teacher
    {
        // Check if teacher already exists in academy
        $existingPivot = $academy->teachers()->where('teacher_id', $teacherId)->first();
        
        if ($existingPivot) {
            // If teacher exists but is inactive, reactivate them
            if (!$existingPivot->pivot->is_active) {
                $academy->teachers()->updateExistingPivot($teacherId, [
                    'is_active' => true,
                    'joined_at' => Carbon::now(),
                ]);
                
                // Reload teacher with updated pivot data
                return $academy->teachers()
                    ->select('teachers.*')
                    ->withPivot('is_active', 'joined_at')
                    ->where('teacher_id', $teacherId)
                    ->first();
            }
            
            // Teacher is already active in this academy
            throw new \Exception('المدرس موجود بالفعل في الأكاديمية');
        }

        // Teacher doesn't exist in academy, add them
        $academy->teachers()->attach($teacherId, [
            'is_active' => true,
            'joined_at' => Carbon::now(),
        ]);

        // Reload teacher with pivot data and all columns
        return $academy->teachers()
            ->select('teachers.*')
            ->withPivot('is_active', 'joined_at')
            ->where('teacher_id', $teacherId)
            ->first();
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
            'password' => \Illuminate\Support\Facades\Hash::make($data->password),
            'subject' => $data->subject ?? null,
            'status' => 'pending', // Default to pending for new teachers
        ]);

        $academy->teachers()->attach($teacher->id, [
            'is_active' => true,
            'joined_at' => Carbon::now(),
        ]);

        // Reload teacher with pivot data and all columns
        return $academy->teachers()
            ->select('teachers.*')
            ->withPivot('is_active', 'joined_at')
            ->where('teacher_id', $teacher->id)
            ->first();
    }

    /**
     * Update teacher
     */
    public function updateTeacher(Academy $academy, string $teacherId, \App\DTOs\Academy\TeacherData $data): Teacher
    {
        // Ensure teacher is linked to this academy
        $teacher = $academy->teachers()->findOrFail($teacherId);

        // Check if phone exists for another teacher
        if (Teacher::where('phone', $data->phone)->where('id', '!=', $teacherId)->exists()) {
            throw new \Exception('رقم الهاتف مستخدم بالفعل');
        }

        $teacher->name = $data->name;
        $teacher->phone = $data->phone;
        
        if ($data->password) {
            $teacher->password = \Illuminate\Support\Facades\Hash::make($data->password);
        }
        
        if ($data->subject !== null) {
            $teacher->subject = $data->subject;
        }

        $teacher->save();

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
