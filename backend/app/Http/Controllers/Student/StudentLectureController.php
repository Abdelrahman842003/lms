<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Lecture;

class StudentLectureController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
        ]);

        $lectures = Lecture::where('teacher_id', $request->teacher_id)
            ->with(['attendances' => function ($q) use ($request) {
                $q->where('student_id', $request->user()->id);
            }])
            ->latest()
            ->paginate(10);

        $lectures->getCollection()->transform(function ($lecture) {
            $attendance = $lecture->attendances->first();
            $lecture->is_attended = $attendance && $attendance->status === 'present';
            $lecture->date = $lecture->start_time->format('Y-m-d');
            $lecture->time = $lecture->start_time->format('H:i');
            $lecture->iso_start_time = $lecture->start_time->toIso8601String();
            $lecture->iso_end_time = $lecture->end_time->toIso8601String();
            $lecture->duration = $lecture->start_time->diffInMinutes($lecture->end_time);
            unset($lecture->attendances);
            return $lecture;
        });

        return $this->successResponse($lectures);
    }
}
