<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Lecture;
use App\Models\StudentPoint;
use App\Models\Teacher;
use App\Services\Student\MistakesService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\Student\Dashboard\StudentDashboardRequest;

class StudentDashboardController extends Controller
{
    public function __construct(
        private MistakesService $mistakesService,
        private \App\Services\Student\StudentDashboardService $dashboardService
    ) {}

    public function getDashboard(StudentDashboardRequest $request): JsonResponse
    {
        // Validation handled by FormRequest

        $student = $request->user();
        $teacherId = $request->teacher_id;

        // 0. Validate Teacher & Enrollment Status
        $teacher = Teacher::find($teacherId);
        if (!$teacher || $teacher->status === 'suspended') {
             return $this->errorResponse('Teacher is suspended or not found', 403);
        }

        // 1. Get Enrollment (for Balance & Status)
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->first();

        if (!$enrollment || !$enrollment->is_active) {
             return $this->errorResponse('Enrollment is not active', 403);
        }

        // 2. Mistakes Count (Unmastered)
        $mistakesStats = $this->mistakesService->getStats($student->id, $teacherId);
        $mistakesCount = $mistakesStats['pending'] ?? 0;

        // 3. Total Points
        $pointsRecord = StudentPoint::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->first();
        $totalPoints = $pointsRecord ? $pointsRecord->total_points : 0;

        // Use service for stats
        $teacherStats = $this->dashboardService->getTeacherStats($student, $teacherId);

        // 7. Upcoming Lectures (Keep for now as it might be used elsewhere, or just return empty if frontend removes it)
        $upcomingLectures = Lecture::where('teacher_id', $teacherId)
            ->where('start_time', '>=', Carbon::today())
            ->orderBy('start_time')
            ->take(3)
            ->get()
            ->map(function ($lecture) {
                return [
                    'id' => $lecture->id,
                    'title' => $lecture->title,
                    'date' => $lecture->start_time->format('Y-m-d'),
                    'time' => $lecture->start_time->format('H:i'),
                    'status' => 'قادمة',
                ];
            });

        // 8. Latest News (Mixed Feed: Attendance & Exams)
        $recentAttendance = $student->attendances()
            ->whereHas('lecture', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->with('lecture:id,title')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($attendance) {
                return [
                    'type' => 'attendance',
                    'id' => $attendance->id,
                    'title' => $attendance->lecture->title,
                    'status' => $attendance->status, // present, absent
                    'date' => $attendance->created_at->format('Y-m-d'),
                    'timestamp' => $attendance->created_at->timestamp,
                ];
            });

        $recentExams = Exam::where('teacher_id', $teacherId)
            ->whereHas('results', function ($q) use ($student) {
                $q->where('student_id', $student->id);
            })
            ->with(['results' => function ($q) use ($student) {
                $q->where('student_id', $student->id);
            }])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($exam) {
                $result = $exam->results->first();
                return [
                    'type' => 'exam',
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'score' => $result ? $result->score : 0,
                    'total' => $exam->total_marks ?? 100,
                    'date' => $exam->created_at->format('Y-m-d'),
                    'timestamp' => $exam->created_at->timestamp,
                ];
            });

        // Merge and sort by timestamp desc
        $latestNews = $recentAttendance->concat($recentExams)
            ->sortByDesc('timestamp')
            ->take(5)
            ->values();

        return $this->successResponse([
            'stats' => [
                'walletBalance' => $enrollment ? $enrollment->balance : 0,
                'mistakesCount' => $mistakesCount,
                'totalPoints' => $totalPoints,
                'attendanceRate' => $teacherStats['attendance_rate'],
                'examAverage' => round($teacherStats['exam_average'], 1),
            ],
            'upcomingLectures' => $upcomingLectures,
            'latestNews' => $latestNews,
        ], 'تم استرجاع بيانات لوحة التحكم بنجاح');
    }
}
