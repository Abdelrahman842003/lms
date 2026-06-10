<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Student;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Application\Exceptions\LockoutException;
use App\Domains\Auth\Models\Student;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Gamification\Services\PointService;
use App\Domains\Lectures\Jobs\ProcessAttendanceEntryJob;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class StudentAttendanceService
{
    private PointService $pointService;

    public function __construct(
        PointService $pointService
    ) {
        $this->pointService = $pointService;
    }

    /**
     * Get attendance records for a student and teacher
     */
    public function getAttendances(Student $student, string $teacherProfileId, int $perPage = 10)
    {
        return $student->attendances()
            ->whereHas('lecture', function ($q) use ($teacherProfileId) {
                $q->where('teacher_profile_id', $teacherProfileId);
            })
            ->with(['lecture:id,title,start_time'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Mark attendance for a student using 6-digit code
     */
    public function markAttendance(Student $student, string $code): array
    {
        $lockoutKey = "attendance_lockout:{$student->id}";
        $failuresKey = "attendance_failures:{$student->id}";

        if (\Illuminate\Support\Facades\Cache::has($lockoutKey)) {
            $lockoutEnd = \Illuminate\Support\Facades\Cache::get($lockoutKey);
            $remainingSeconds = max(0, $lockoutEnd - now()->timestamp);
            
            if ($remainingSeconds > 0) {
                $minutes = ceil($remainingSeconds / 60);
                throw new LockoutException(
                    "تم إيقافك مؤقتاً بسبب كثرة المحاولات الخاطئة. يرجى المحاولة بعد {$minutes} دقيقة.",
                    (int) $remainingSeconds
                );
            } else {
                \Illuminate\Support\Facades\Cache::forget($lockoutKey);
            }
        }

        $lecture = $this->validateAttendanceCode($code);

        if (!$lecture) {
            $failures = (int) \Illuminate\Support\Facades\Cache::get($failuresKey, 0) + 1;
            \Illuminate\Support\Facades\Cache::put($failuresKey, $failures, now()->addHours(24));

            if ($failures >= 6) {
                $lockoutTime = 3;
                $lockoutEnd = now()->addMinutes($lockoutTime)->timestamp;
                \Illuminate\Support\Facades\Cache::put($lockoutKey, $lockoutEnd, now()->addMinutes($lockoutTime));
                \Illuminate\Support\Facades\Cache::forget($failuresKey);
                throw new LockoutException(
                    "تم إيقافك لمدة {$lockoutTime} دقائق بسبب تجاوز الحد الأقصى للمحاولات الخاطئة.",
                    $lockoutTime * 60
                );
            } elseif ($failures === 3) {
                $lockoutTime = 3;
                $lockoutEnd = now()->addMinutes($lockoutTime)->timestamp;
                \Illuminate\Support\Facades\Cache::put($lockoutKey, $lockoutEnd, now()->addMinutes($lockoutTime));
                throw new LockoutException(
                    "تم إيقافك لمدة {$lockoutTime} دقائق بسبب تكرار المحاولات الخاطئة.",
                    $lockoutTime * 60
                );
            }

            $remaining = ($failures < 3) ? 3 - $failures : 6 - $failures;
            throw new DomainException("كود غير صحيح. المتبقي لك {$remaining} محاولة قبل الإيقاف.");
        }

        // Clear failures on success
        \Illuminate\Support\Facades\Cache::forget($failuresKey);
        \Illuminate\Support\Facades\Cache::forget($lockoutKey);

        // Check if student already marked attendance for this lecture today
        $existing = Attendance::where('lecture_id', $lecture->id)
            ->where('student_id', $student->id)
            ->whereHas('session', function ($q) {
                $q->where('date', now()->toDateString());
            })
            ->first();

        if ($existing) {
            return [
                'status' => 'success',
                'attendance' => $existing,
                'lecture' => $lecture,
                'was_recently_created' => false,
                'point_transaction' => null,
            ];
        }

        // Dispatch job for processing
        $position = (int) \Illuminate\Support\Facades\Cache::increment("waiting-room:lecture:{$lecture->id}:joined");
        ProcessAttendanceEntryJob::dispatch((string) $lecture->id, (string) $student->id, $position);

        return [
            'status' => 'queued',
            'position' => $position,
            'lecture_id' => $lecture->id,
            'lecture_title' => $lecture->title
        ];
    }

    /**
     * Process a queued attendance request
     */
    public function processQueuedAttendance(Student $student, Lecture $lecture): array
    {
        // Find or create a lecture session for today
        $session = $lecture->sessions()->updateOrCreate(
            ['date' => now()->toDateString()],
            ['title' => $lecture->title . ' - ' . now()->toDateString()]
        );

        // Create or update attendance record
        $attendance = Attendance::updateOrCreate(
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
            'status' => 'success',
            'attendance' => $attendance,
            'lecture' => [
                'title' => $lecture->title,
            ],
            'was_recently_created' => $wasRecentlyCreated,
            'point_transaction' => $pointTransaction,
        ];
    }

    /**
     * Validate 6-digit attendance code and return lecture
     */
    private function validateAttendanceCode(string $code): ?Lecture
    {
        $lectureId = \Illuminate\Support\Facades\Cache::get('attendance_code:' . $code);

        if (!$lectureId) {
            return null;
        }

        $lecture = Lecture::find($lectureId);

        if (!$lecture || !$lecture->is_active) {
            return null;
        }

        return $lecture;
    }
}
