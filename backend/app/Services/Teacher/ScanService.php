<?php

declare(strict_types=1);

namespace App\Services\Teacher;

use App\Models\Academy;
use App\Models\TeacherAttendanceLog;
use App\Models\Teacher;
use Carbon\Carbon;

class ScanService
{
    /**
     * Handle check-in
     */
    public function checkin(Teacher $teacher, string $qrCode): array
    {
        // Find academy by check-in QR code
        $academy = Academy::where('checkin_qr_code', $qrCode)
            ->active()
            ->first();

        if (!$academy) {
            throw new \Exception('رمز QR غير صحيح أو الأكاديمية غير مفعلة');
        }

        // Check if teacher belongs to this academy
        if (!$academy->teachers()->where('teacher_id', $teacher->id)->exists()) {
            throw new \Exception('أنت غير مسجل في هذه الأكاديمية');
        }

        $today = Carbon::today();

        // Check if already checked in today
        $existingLog = TeacherAttendanceLog::forAcademy($academy->id)
            ->forTeacher($teacher->id)
            ->whereDate('date', $today)
            ->first();

        if ($existingLog && $existingLog->checked_in_at) {
            throw new \Exception('لقد سجلت حضورك بالفعل اليوم');
        }

        // Create or update log
        $log = TeacherAttendanceLog::updateOrCreate(
            [
                'academy_id' => $academy->id,
                'teacher_id' => $teacher->id,
                'date' => $today,
            ],
            [
                'checked_in_at' => Carbon::now(),
                'status' => 'checked_in',
            ]
        );

        return [
            'log' => $log,
            'academy' => $academy,
        ];
    }

    /**
     * Handle check-out
     */
    public function checkout(Teacher $teacher, string $qrCode): array
    {
        // Find academy by check-out QR code
        $academy = Academy::where('checkout_qr_code', $qrCode)
            ->active()
            ->first();

        if (!$academy) {
            throw new \Exception('رمز QR غير صحيح أو الأكاديمية غير مفعلة');
        }

        // Check if teacher belongs to this academy
        if (!$academy->teachers()->where('teacher_id', $teacher->id)->exists()) {
            throw new \Exception('أنت غير مسجل في هذه الأكاديمية');
        }

        $today = Carbon::today();

        // Find today's log
        $log = TeacherAttendanceLog::forAcademy($academy->id)
            ->forTeacher($teacher->id)
            ->whereDate('date', $today)
            ->first();

        if (!$log || !$log->checked_in_at) {
            throw new \Exception('يجب تسجيل الحضور أولاً');
        }

        if ($log->checked_out_at) {
            throw new \Exception('لقد سجلت الانصراف بالفعل');
        }

        $log->checked_out_at = Carbon::now();
        $log->status = 'checked_out';
        $log->save();

        return [
            'log' => $log,
            'academy' => $academy,
        ];
    }

    /**
     * Get today's attendance status
     */
    public function getTodayStatus(Teacher $teacher): array
    {
        $today = Carbon::today();

        $logs = TeacherAttendanceLog::forTeacher($teacher->id)
            ->whereDate('date', $today)
            ->with('academy')
            ->get();

        return $logs->toArray();
    }
}
