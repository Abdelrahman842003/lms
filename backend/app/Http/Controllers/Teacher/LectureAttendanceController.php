<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Lecture;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class LectureAttendanceController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    public function generateQrCode(Request $request, Lecture $lecture)
    {
        // Ensure the user is the teacher of this lecture
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            abort(403, 'Unauthorized');
        }

        $token = Str::random(32);
        $lecture->update([
            'qr_code' => $token,
            'qr_code_expires_at' => Carbon::now()->addHour(),
        ]);

        // Return the full URL that the student should visit
        // Assuming the frontend student route is /student/attend?token=...
        $url = config('app.url') . '/student/attend?token=' . $token;

        return $this->successResponse([
            'qr_code_url' => $url,
            'expires_at' => $lecture->qr_code_expires_at,
        ]);
    }

    public function recordAttendance(Request $request, Lecture $lecture)
    {
        // Ensure the user is the teacher of this lecture
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $studentId = $request->input('student_id');

        // Check if student is already attended
        $existingAttendance = Attendance::where('lecture_id', $lecture->id)
            ->where('student_id', $studentId)
            ->first();

        if ($existingAttendance) {
            return $this->successResponse([
                'message' => 'الطالب مسجل حضور بالفعل',
                'status' => 'already_attended'
            ]);
        }

        Attendance::create([
            'lecture_id' => $lecture->id,
            'student_id' => $studentId,
            'status' => 'present', // You might want to use an enum or constant
        ]);

        $student = \App\Models\Student::find($studentId);
        $student->notify(new \App\Notifications\StudentAttendanceNotification($lecture->title, $this->getTeacherFromRequest($request)->name));

        return $this->successResponse([
            'message' => 'تم تسجيل الحضور بنجاح',
            'status' => 'attended'
        ]);
    }
}
