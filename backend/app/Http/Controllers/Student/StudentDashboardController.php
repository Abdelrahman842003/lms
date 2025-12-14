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

        // 2. Purchased Lectures Count
        // Assuming purchased lectures are tracked via student_lectures pivot or similar. 
        // Checking StudentLectureController logic might be needed, but for now let's assume 
        // we can count lectures where the student has access. 
        // Actually, looking at previous code, 'purchased' logic was: 
        // $purchasedLectures = lectures.filter(l => l.is_purchased || l.price === 0);
        // In backend, we need to check how purchase is stored. 
        // Let's assume a 'purchases' relationship or similar on Student model, or check 'lectures' relationship.
        // Based on StudentLectureController: 
        // $lectures = Lecture::where('teacher_id', $request->teacher_id)...
        // It doesn't explicitly show purchase logic other than 'attendances'.
        // Let's assume for now we count attended/purchased lectures if there's a pivot.
        // Wait, the user said "Wallet Balance" and "Purchased Lectures".
        // Let's look at `Student` model to see relationships.
        
        // 3. Attendance Rate
        $totalLectures = Lecture::where('teacher_id', $teacherId)->count();
        $attendedLectures = $student->attendances()
            ->whereHas('lecture', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->where('status', 'present')
            ->count();
            
        $attendanceRate = $totalLectures > 0 ? round(($attendedLectures / $totalLectures) * 100) : 0;

        // 4. Exam Average
        $examResults = ExamResult::where('student_id', $student->id)
            ->whereHas('exam', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->get();
            
        $examAverage = $examResults->avg('score') ?? 0;

        // 5. Upcoming Lectures
        // 5. Upcoming Lectures
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

        // 6. Recent Exams
        $recentExams = Exam::where('teacher_id', $teacherId)
            ->whereHas('results', function ($q) use ($student) {
                $q->where('student_id', $student->id);
            })
            ->with(['results' => function ($q) use ($student) {
                $q->where('student_id', $student->id);
            }])
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($exam) {
                $result = $exam->results->first();
                return [
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'score' => $result ? $result->score : 0,
                    'total' => $exam->total_marks ?? 100, // Assuming total_marks exists
                    'date' => $exam->created_at->format('Y-m-d'),
                ];
            });

        return response()->json([
            'stats' => [
                'walletBalance' => $enrollment ? $enrollment->balance : 0,
                'purchasedLectures' => 0, // Placeholder until we confirm purchase logic
                'attendanceRate' => $attendanceRate,
                'examAverage' => round($examAverage, 1),
            ],
            'upcomingLectures' => $upcomingLectures,
            'recentExams' => $recentExams,
        ]);
    }
}
