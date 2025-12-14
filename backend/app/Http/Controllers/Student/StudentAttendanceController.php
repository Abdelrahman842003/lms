<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\MarkAttendanceRequest;
use Illuminate\Http\Request;
use App\Models\Lecture;
use App\Models\Attendance;
use Carbon\Carbon;

class StudentAttendanceController extends Controller
{
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
        $lecture = Lecture::where('qr_code', $request->token)->first();

        if (!$lecture) {
            return $this->errorResponse('Invalid QR code', 404);
        }

        if (Carbon::now()->greaterThan($lecture->qr_code_expires_at)) {
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

        // Send Notification
        $student->notify(new \App\Notifications\StudentAttendanceNotification($lecture->title, $lecture->teacher->name));

        return $this->successResponse([
            'message' => 'Attendance marked successfully',
            'lecture' => $lecture->title,
        ]);
    }
}
