<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Support\Models\TeacherAttendanceLog;
use Carbon\Carbon;

class AttendanceService
{
    /**
     * Get attendance logs with filtering
     */
    public function getAttendanceLogs(
        Academy $academy,
        int $perPage,
        ?string $teacherId = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $status = null
    ) {
        $query = TeacherAttendanceLog::forAcademy($academy->id)
            ->with('teacher')
            ->orderBy('date', 'desc');

        if ($teacherId) {
            $query->forTeacher($teacherId);
        }

        if ($dateFrom) {
            $query->whereDate('date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('date', '<=', $dateTo);
        }

        if ($status) {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get today's attendance
     */
    public function getTodayAttendance(Academy $academy)
    {
        $today = Carbon::today();

        return TeacherAttendanceLog::forAcademy($academy->id)
            ->with('teacher')
            ->whereDate('date', $today)
            ->orderBy('checked_in_at', 'desc')
            ->get();
    }

    /**
     * Mark teacher as absent
     */
    /**
     * Mark teacher as absent
     */
    public function markAbsent(Academy $academy, \App\Domains\Lectures\DTOs\AttendanceData $data): TeacherAttendanceLog
    {
        // Check if log already exists
        $existing = TeacherAttendanceLog::forAcademy($academy->id)
            ->forTeacher($data->teacher_id)
            ->whereDate('date', $data->date)
            ->first();

        if ($existing) {
            throw new \Exception('سجل الحضور موجود بالفعل لهذا اليوم');
        }

        return TeacherAttendanceLog::create([
            'academy_id' => $academy->id,
            'teacher_id' => $data->teacher_id,
            'date' => $data->date,
            'status' => 'absent',
            'notes' => $data->notes,
        ]);
    }

    /**
     * Update notes for attendance log
     */
    public function updateNotes(string $logId, string $notes): TeacherAttendanceLog
    {
        $log = TeacherAttendanceLog::findOrFail($logId);
        $log->update(['notes' => $notes]);

        return $log->fresh();
    }

    /**
     * Get attendance statistics for a date range
     */
    public function getStats(Academy $academy, string $dateFrom, string $dateTo): array
    {
        $logs = TeacherAttendanceLog::forAcademy($academy->id)
            ->dateRange($dateFrom, $dateTo)
            ->get();

        $totalDays = Carbon::parse($dateFrom)->diffInDays(Carbon::parse($dateTo)) + 1;
        $activeTeachers = $academy->activeTeachers()->count();

        $totalPresent = $logs->where('status', 'checked_out')->count();
        $totalAbsent = $logs->where('status', 'absent')->count();
        $totalCheckedIn = $logs->where('status', 'checked_in')->count();

        $totalDuration = $logs->sum('duration_minutes');
        $averageDuration = $totalPresent > 0 ? $totalDuration / $totalPresent : 0;

        // Calculate attendance by day
        $attendanceByDay = [];
        $currentDate = Carbon::parse($dateFrom);
        $endDate = Carbon::parse($dateTo);

        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->toDateString();
            $dayLogs = $logs->where('date', $dateStr);

            $attendanceByDay[] = [
                'date' => $dateStr,
                'present' => $dayLogs->where('status', 'checked_out')->count(),
                'absent' => $dayLogs->where('status', 'absent')->count(),
                'checked_in' => $dayLogs->where('status', 'checked_in')->count(),
            ];

            $currentDate->addDay();
        }

        // Calculate attendance by teacher
        $attendanceByTeacher = [];
        foreach ($academy->activeTeachers as $teacher) {
            $teacherLogs = $logs->where('teacher_id', $teacher->id);
            
            $attendanceByTeacher[] = [
                'teacher_id' => $teacher->id,
                'teacher_name' => $teacher->name,
                'present' => $teacherLogs->where('status', 'checked_out')->count(),
                'absent' => $teacherLogs->where('status', 'absent')->count(),
                'total_duration' => $teacherLogs->sum('duration_minutes'),
            ];
        }

        return [
            'summary' => [
                'total_days' => $totalDays,
                'total_teachers' => $activeTeachers,
                'total_present' => $totalPresent,
                'total_absent' => $totalAbsent,
                'total_checked_in' => $totalCheckedIn,
                'total_duration_minutes' => $totalDuration,
                'average_duration_minutes' => round($averageDuration),
            ],
            'attendance_by_day' => $attendanceByDay,
            'attendance_by_teacher' => $attendanceByTeacher,
        ];
    }
}
