<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\MarkAttendanceRequest;
use App\Services\PointService;
use Illuminate\Http\Request;
use App\Models\Lecture;
use App\Models\Attendance;
use Carbon\Carbon;

class StudentAttendanceController extends Controller
{
    public function __construct(
        private PointService $pointService
    ) {}

    public function index(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
        ]);

        $attendances = $request->user()->attendances()
            ->whereHas('lecture', function ($q) use ($request) {
                $q->where('teacher_id', $request->teacher_id);
            })
            ->with(['lecture:id,title,start_time'])
            ->latest()
            ->paginate(10);

        return $this->successResponse($attendances);
    }
    public function markAttendance(MarkAttendanceRequest $request)
    {
        $token = $request->token;
        $lecture = null;

        try {
            $decrypted = \Illuminate\Support\Facades\Crypt::decryptString($token);
            $payload = json_decode($decrypted, true);
            
            if (is_array($payload) && isset($payload['lecture_id']) && isset($payload['expires_at'])) {
                if (Carbon::now()->timestamp > $payload['expires_at']) {
                    return $this->errorResponse('QR code has expired', 400);
                }
                $lecture = Lecture::find($payload['lecture_id']);
            }
        } catch (\Exception $e) {
            // Fallback to legacy static QR code
            $lecture = Lecture::where('qr_code', $token)->first();
        }

        if (!$lecture) {
            return $this->errorResponse('Invalid QR code', 404);
        }

        // For legacy codes, check expiration from DB
        if ($lecture->qr_code === $token && $lecture->qr_code_expires_at && Carbon::now()->greaterThan($lecture->qr_code_expires_at)) {
            return $this->errorResponse('QR code has expired', 400);
        }

        $student = $request->user();

        $attendance = Attendance::firstOrCreate(
            [
                'lecture_id' => $lecture->id,
                'student_id' => $student->id,
            ],
            [
                'status' => 'present',
            ]
        );

        if (!$attendance->wasRecentlyCreated && $attendance->status === 'present') {
             return $this->successResponse([
                'message' => 'Already marked as present',
                'lecture' => $lecture->title,
            ]);
        }
        
        $attendance->update(['status' => 'present']);

        $lecture->load('teacher');

        $pointTransaction = null;
        try {
            // Award attendance points
            $pointTransaction = $this->pointService->awardAttendancePoints($student, $lecture);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to award attendance points: ' . $e->getMessage());
        }

        // Send Notification
        try {
            if ($lecture->teacher) {
                $student->notify(new \App\Notifications\StudentAttendanceNotification($lecture->title, $lecture->teacher->name));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send attendance notification: ' . $e->getMessage());
        }

        return $this->successResponse([
            'message' => 'Attendance marked successfully',
            'lecture' => $lecture->title,
            'points_earned' => $pointTransaction?->points ?? 0,
        ]);
    }
}

