<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Student;

use App\Domains\Auth\Models\Student;
use App\Domains\Lectures\Models\Lecture;
use Illuminate\Pagination\LengthAwarePaginator;

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

        $lectures = Lecture::where('teacher_id', $teacherId)
            ->where(function($query) use ($gradeIds) {
                $query->whereIn('grade_id', $gradeIds)
                      ->orWhereNull('grade_id');
            })
            ->with(['attendances' => function ($q) use ($student) {
                $q->where('student_id', $student->id);
            }, 'sessions' => function ($q) {
                $q->whereDate('date', '>=', now()->toDateString())
                    ->orderBy('date', 'asc');
            }])
            ->latest()
            ->paginate($perPage);

        // Transform the collection
        $lectures->getCollection()->transform(function ($lecture) {
            $attendance = $lecture->attendances->first();
            $nextSession = $lecture->sessions
                ->first(fn ($session) => ! $session->is_cancelled);

            $nextSessionTitle = $nextSession?->title;
            $nextSessionDescription = $nextSession?->description;

            $lecture->is_attended = $attendance && $attendance->status === 'present';
            $lecture->date = $lecture->start_time?->format('Y-m-d');
            $lecture->time = $lecture->start_time?->format('H:i');
            $lecture->iso_start_time = $lecture->start_time?->toIso8601String();
            $lecture->iso_end_time = $lecture->end_time?->toIso8601String();
            $lecture->duration = ($lecture->start_time && $lecture->end_time)
                ? $lecture->start_time->diffInMinutes($lecture->end_time)
                : 0;
            $lecture->next_session_date = $nextSession?->date?->toDateString();
            $lecture->next_session_title = $nextSessionTitle;
            $lecture->next_session_description = $nextSessionDescription;
            $lecture->display_title = filled($nextSessionTitle)
                ? $nextSessionTitle
                : $lecture->title;
            $lecture->display_description = filled($nextSessionDescription)
                ? $nextSessionDescription
                : $lecture->description;
            unset($lecture->attendances);
            unset($lecture->sessions);
            return $lecture;
        });

        return $lectures;
    }
}
