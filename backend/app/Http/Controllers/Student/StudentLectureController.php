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

        $student = $request->user();
        
        // Get student's enrollments for this teacher to find their grades
        $enrollments = $student->enrollments()
            ->where('teacher_id', $request->teacher_id)
            ->where('is_active', true)
            ->get();
            
        $gradeIds = $enrollments->pluck('grade_id')->filter()->unique()->values();

        \Illuminate\Support\Facades\Log::info('Student Lectures Query', [
            'student_id' => $student->id,
            'teacher_id' => $request->teacher_id,
            'enrollments_count' => $enrollments->count(),
            'grade_ids' => $gradeIds->toArray(),
        ]);

        $lectures = Lecture::where('teacher_id', $request->teacher_id)
            ->where(function($query) use ($gradeIds) {
                $query->whereIn('grade_id', $gradeIds)
                      ->orWhereNull('grade_id');
            })
            ->with(['attendances' => function ($q) use ($student) {
                $q->where('student_id', $student->id);
            }])
            ->latest()
            ->paginate(10);

        \Illuminate\Support\Facades\Log::info('Student Lectures Result', [
            'total_lectures' => $lectures->total(),
            'lectures_count' => $lectures->count(),
        ]);

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
