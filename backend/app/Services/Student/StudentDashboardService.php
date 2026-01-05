<?php

namespace App\Services\Student;

use App\Models\Student;
use App\Models\Lecture;
use App\Models\Exam;
use App\Models\Enrollment;
use App\Models\Attendance;
use App\Models\ExamResult;
use Carbon\Carbon;

class StudentDashboardService
{
    public function getDashboardStats(Student $student)
    {
        $enrollments = $student->enrollments()->where('is_active', true)->with('teacher')->get();
        
        $stats = [
            'total_teachers' => $enrollments->count(),
            'total_lectures_attended' => 0,
            'total_exams_taken' => 0,
            'average_exam_score' => 0,
            'upcoming_lectures' => [],
            'upcoming_exams' => [],
            'recent_activities' => [],
        ];

        // Aggregate stats
        $stats['total_lectures_attended'] = Attendance::where('student_id', $student->id)
            ->where('status', 'present')
            ->count();

        $examResults = ExamResult::where('student_id', $student->id)->get();
        $stats['total_exams_taken'] = $examResults->count();
        $stats['average_exam_score'] = $examResults->avg('percentage') ?? 0;

        // Get upcoming lectures (active lectures for enrolled teachers)
        $teacherIds = $enrollments->pluck('teacher_id');
        
        $stats['upcoming_lectures'] = Lecture::whereIn('teacher_id', $teacherIds)
            ->where('is_active', true)
            ->with('teacher:id,name,avatar_key')
            ->latest()
            ->take(5)
            ->get();

        // Get upcoming exams (active exams)
        $stats['upcoming_exams'] = Exam::whereIn('teacher_id', $teacherIds)
            ->where('is_active', true)
            ->with('teacher:id,name,avatar_key')
            ->latest()
            ->take(5)
            ->get();

        return $stats;
    }

    public function getTeacherStats(Student $student, string $teacherId)
    {
        // Verify enrollment
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->firstOrFail();

        $lectures = Lecture::where('teacher_id', $teacherId)->get();
        $exams = Exam::where('teacher_id', $teacherId)->get();

        $attendanceCount = Attendance::whereIn('lecture_id', $lectures->pluck('id'))
            ->where('student_id', $student->id)
            ->where('status', 'present')
            ->count();

        $examResults = ExamResult::whereIn('exam_id', $exams->pluck('id'))
            ->where('student_id', $student->id)
            ->get();

        return [
            'attendance_rate' => $lectures->count() > 0 ? round(($attendanceCount / $lectures->count()) * 100) : 0,
            'exam_average' => $examResults->avg('percentage') ?? 0,
            'exams_taken' => $examResults->count(),
            'total_exams' => $exams->count(),
            'subscription_status' => [
                'is_active' => $enrollment->is_active,
                'ends_at' => $enrollment->subscription_end,
            ]
        ];
    }
}
