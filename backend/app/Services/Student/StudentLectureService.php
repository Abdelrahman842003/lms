<?php

declare(strict_types=1);

namespace App\Services\Student;

use App\Models\Student;
use App\Models\Lecture;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;

class StudentLectureService
{
    /**
     * Get lectures for a specific teacher
     */
    public function getLectures(Student $student, string $teacherId, int $perPage = 10): LengthAwarePaginator
    {
        // Get student's enrollments for this teacher to find their grades
        $enrollments = $student->enrollments()
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->get();

        $gradeIds = $enrollments->pluck('grade_id')->filter()->unique()->values();

        Log::info('Student Lectures Query', [
            'student_id' => $student->id,
            'teacher_id' => $teacherId,
            'enrollments_count' => $enrollments->count(),
            'grade_ids' => $gradeIds->toArray(),
        ]);

        $lectures = Lecture::where('teacher_id', $teacherId)
            ->where(function($query) use ($gradeIds) {
                $query->whereIn('grade_id', $gradeIds)
                      ->orWhereNull('grade_id');
            })
            ->with(['attendances' => function ($q) use ($student) {
                $q->where('student_id', $student->id);
            }])
            ->latest()
            ->paginate($perPage);

        Log::info('Student Lectures Result', [
            'total_lectures' => $lectures->total(),
            'lectures_count' => $lectures->count(),
        ]);

        // Transform the collection
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

        return $lectures;
    }
}
