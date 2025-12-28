<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\Infrastructure\CacheService;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Lecture;

class DashboardController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    public function getStats(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);

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

            // Attendance Trend (Last 7 Lectures)
            $attendanceTrend = $teacher->lectures()
                ->where('start_time', '<=', now())
                ->orderBy('start_time', 'desc')
                ->take(7)
                ->get()
                ->map(function ($lecture) {
                    $total = $lecture->attendances()->count();
                    $present = $lecture->attendances()->where('status', 'present')->count();
                    return [
                        'date' => $lecture->start_time->format('m/d'),
                        'rate' => $total > 0 ? round(($present / $total) * 100) : 0,
                    ];
                })->reverse()->values();

            return [
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'total_groups' => $totalGroups,
                'total_exams' => $totalExams,
                'average_attendance' => $averageAttendance,
                'attendance_trend' => $attendanceTrend,
            ];
        });

        return $this->successResponse($stats);
    }

    public function getRecentStudents(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
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
        $teacher = $this->getTeacherFromRequest($request);
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
