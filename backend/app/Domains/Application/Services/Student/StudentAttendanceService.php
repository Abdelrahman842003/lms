<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Student;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Auth\Models\Student;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Gamification\Services\PointService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class StudentAttendanceService
{
    public function __construct(
        private PointService $pointService
    ) {}

    /**
     * Get attendance records for a student and teacher
     */
    public function getAttendances(Student $student, string $teacherId, int $perPage = 10)
    {
        return $student->attendances()
            ->whereHas('lecture', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->with(['lecture:id,title,start_time'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Mark attendance for a student using QR code
     */
    public function markAttendance(Student $student, string $token): array
    {
        $lecture = $this->validateQrCode($token);

        if (!$lecture) {
            throw new DomainException('Invalid QR code');
        }

        // Check if QR code is expired
        if ($this->isQrCodeExpired($lecture, $token)) {
            throw new DomainException('QR code has expired');
        }

        // Find or create a lecture session for today
        $session = $lecture->sessions()->updateOrCreate(
            ['date' => now()->toDateString()],
            ['title' => $lecture->title . ' - ' . now()->toDateString()]
        );

        // Create or update attendance record
        $attendance = Attendance::firstOrCreate(
            [
                'lecture_id' => $lecture->id,
                'student_id' => $student->id,
                'lecture_session_id' => $session->id,
            ],
            [
                'status' => 'present',
            ]
        );

        $wasRecentlyCreated = $attendance->wasRecentlyCreated;
        
        // Update status if already exists
        if (!$wasRecentlyCreated && $attendance->status !== 'present') {
            $attendance->update(['status' => 'present']);
        }

        // Load lecture with teacher
        $lecture->load('teacher');

        // Award attendance points
        $pointTransaction = null;
        try {
            $pointTransaction = $this->pointService->awardAttendancePoints($student, $lecture);
        } catch (\Exception $e) {
            Log::error('Failed to award attendance points: ' . $e->getMessage());
        }

        // Send notification
        try {
            if ($lecture->teacher) {
                $student->notify(new \App\Domains\Lectures\Notifications\StudentAttendanceNotification($lecture->title, $lecture->teacher->name));
            }
        } catch (\Exception $e) {
            Log::error('Failed to send attendance notification: ' . $e->getMessage());
        }

        return [
            'attendance' => $attendance,
            'lecture' => $lecture,
            'was_recently_created' => $wasRecentlyCreated,
            'point_transaction' => $pointTransaction,
        ];
    }

    /**
     * Validate QR code and return lecture
     */
    private function validateQrCode(string $token): ?Lecture
    {
        $lecture = null;

        try {
            $decrypted = Crypt::decryptString($token);
            $payload = json_decode($decrypted, true);
            
            if (is_array($payload) && isset($payload['lecture_id']) && isset($payload['expires_at'])) {
                if (Carbon::now()->timestamp > $payload['expires_at']) {
                    return null; // Expired
                }
                $lecture = Lecture::find($payload['lecture_id']);
            }
        } catch (\Exception $e) {
            // Fallback to legacy static QR code
            $lecture = Lecture::where('qr_code', $token)->first();
        }

        return $lecture;
    }

    /**
     * Check if QR code is expired
     */
    private function isQrCodeExpired(Lecture $lecture, string $token): bool
    {
        // For legacy codes, check expiration from DB
        if ($lecture->qr_code === $token && $lecture->qr_code_expires_at) {
            return Carbon::now()->greaterThan($lecture->qr_code_expires_at);
        }

        return false;
    }
}
