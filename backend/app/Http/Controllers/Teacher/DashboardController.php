<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\Infrastructure\CacheService;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Lecture;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $teacher = $request->user();

        $stats = CacheService::getTeacherDashboardStats($teacher->id, function () use ($teacher) {
            // Get total students
            $totalStudents = $teacher->students()->count();

            // Get active students (students who have logged in recently or have activity)
            $activeStudents = $totalStudents;

            // Get total groups
            $totalGroups = $teacher->groups()->count();

            // Get total exams
            $totalExams = \App\Models\Exam::where('teacher_id', $teacher->id)->count();

            // Calculate Average Attendance
            // Total Present / Total Attendance Records * 100
            $teacherLecturesIds = $teacher->lectures()->pluck('id');
            $totalAttendanceRecords = \App\Models\Attendance::whereIn('lecture_id', $teacherLecturesIds)->count();
            $totalPresent = \App\Models\Attendance::whereIn('lecture_id', $teacherLecturesIds)
                ->where('status', 'present')
                ->count();
            
            $averageAttendance = $totalAttendanceRecords > 0 
                ? round(($totalPresent / $totalAttendanceRecords) * 100) 
                : 0;

            // Average Exam Score
            $averageExamScore = \App\Models\ExamResult::whereHas('exam', function($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            })->avg('percentage') ?? 0;

            return [
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'total_groups' => $totalGroups,
                'total_exams' => $totalExams,
                'average_attendance' => $averageAttendance,
                'average_exam_score' => round($averageExamScore, 1),
            ];
        });

        return $this->successResponse($stats);
    }

    public function getRecentStudents(Request $request)
    {
        $teacher = $request->user();
        $limit = $request->input('limit', 5);

        $enrollments = \App\Models\Enrollment::where('teacher_id', $teacher->id)
            ->with(['student', 'grade', 'group', 'student.examResults.exam', 'student.attendances.lecture'])
            ->latest()
            ->limit($limit)
            ->get();

        return $this->successResponse([
            'students' => \App\Http\Resources\Teacher\EnrollmentResource::collection($enrollments),
        ]);
    }

    public function getUpcomingLectures(Request $request)
    {
        $teacher = $request->user();
        $limit = $request->input('limit', 4);

        $lectures = $teacher->lectures()
            ->where('start_time', '>', now())
            ->orderBy('start_time', 'asc')
            ->limit($limit)
            ->get()
            ->map(function ($lecture) use ($teacher) {
                // Arabic day names mapping
                $days = [
                    'Sunday' => 'الأحد',
                    'Monday' => 'الاثنين',
                    'Tuesday' => 'الثلاثاء',
                    'Wednesday' => 'الأربعاء',
                    'Thursday' => 'الخميس',
                    'Friday' => 'الجمعة',
                    'Saturday' => 'السبت',
                ];
                
                return [
                    'id' => $lecture->id,
                    'title' => $lecture->title,
                    'date' => $lecture->start_time->format('Y-m-d'),
                    'time' => $lecture->start_time->format('H:i'),
                    'day_name' => $days[$lecture->start_time->format('l')] ?? $lecture->start_time->format('l'),
                    'students' => 0,
                ];
            });

        return $this->successResponse([
            'lectures' => $lectures,
        ]);
    }
}
