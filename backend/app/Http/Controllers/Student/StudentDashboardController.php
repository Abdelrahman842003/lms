<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Enrollment;
use App\Models\Lecture;
use App\Models\Exam;
use App\Models\ExamResult;
use Carbon\Carbon;

class StudentDashboardController extends Controller
{
    public function __construct(
        private \App\Services\MistakesService $mistakesService
    ) {}

    public function index(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
        ]);

        $student = $request->user();
        $teacherId = $request->teacher_id;

        // 1. Get Enrollment (for Balance)
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->first();

        // 2. Mistakes Count (Unmastered)
        $mistakesStats = $this->mistakesService->getStats($student->id, $teacherId);
        $mistakesCount = 888; // Hardcoded debug value

        // 3. Total Points
        $pointsRecord = \App\Models\StudentPoint::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->first();
        $totalPoints = 999; // Hardcoded debug value

        // 4. Attendance Rate
        $totalLectures = Lecture::where('teacher_id', $teacherId)->count();
        $attendedLectures = $student->attendances()
            ->whereHas('lecture', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->where('status', 'present')
            ->count();
            
        $attendanceRate = $totalLectures > 0 ? round(($attendedLectures / $totalLectures) * 100) : 0;

        // 5. Exam Average
        $examResults = ExamResult::where('student_id', $student->id)
            ->whereHas('exam', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->get();
            
        $examAverage = $examResults->avg('score') ?? 0;

        // 6. Upcoming Exams Count
        $upcomingExamsCount = Exam::where('teacher_id', $teacherId)
            ->where('start_date', '>=', Carbon::today())
            ->count();

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

        return response()->json([
            'stats' => [
                'walletBalance' => $enrollment ? $enrollment->balance : 0,
                'mistakesCount' => $mistakesCount,
                'totalPoints' => $totalPoints,
                'upcomingExamsCount' => $upcomingExamsCount,
                'attendanceRate' => $attendanceRate,
                'examAverage' => round($examAverage, 1),
            ],
            'upcomingLectures' => $upcomingLectures,
            'latestNews' => $latestNews,
        ]);
    }
}
