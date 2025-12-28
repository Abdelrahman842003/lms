<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Lecture;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Attendance;
use App\Models\FailedQuestion;
use App\Models\StudentPoint;
use App\Services\Media\ImageService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ParentSummaryController extends Controller
{
    public function __construct(
        private \App\Services\MistakesService $mistakesService,
        private ImageService $imageService
    ) {}

    /**
     * Get parent summary across all active teachers
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'date' => 'nullable|date',
            'period' => 'nullable|in:day,month',
        ]);

        $student = $request->user();
        $date = Carbon::parse($validated['date'] ?? now());
        $period = $validated['period'] ?? 'day';

        // Get all active enrollments
        $enrollments = Enrollment::where('student_id', $student->id)
            ->where('is_active', true)
            ->with(['teacher', 'grade', 'group'])
            ->get();

        $summary = [];

        foreach ($enrollments as $enrollment) {
            $teacher = $enrollment->teacher;
            
            // Skip suspended teachers
            if ($teacher->is_suspended) {
                continue;
            }

            $teacherId = $teacher->id;

            // Calculate date range
            if ($period === 'day') {
                $startDate = $date->copy()->startOfDay();
                $endDate = $date->copy()->endOfDay();
            } else {
                $startDate = $date->copy()->startOfMonth();
                $endDate = $date->copy()->endOfMonth();
            }

            // 1. Attendance Data
            $lecturesInPeriod = Lecture::where('teacher_id', $teacherId)
                ->whereBetween('start_time', [$startDate, $endDate])
                ->get();

            $lectureIds = $lecturesInPeriod->pluck('id');

            $attendanceRecords = Attendance::whereIn('lecture_id', $lectureIds)
                ->where('student_id', $student->id)
                ->get()
                ->keyBy('lecture_id');

            // Build lecture list with attendance status
            $lectureList = $lecturesInPeriod->map(function ($lecture) use ($attendanceRecords) {
                $attendance = $attendanceRecords->get($lecture->id);
                return [
                    'id' => $lecture->id,
                    'title' => $lecture->title,
                    'date' => $lecture->start_time->format('Y-m-d'),
                    'time' => $lecture->start_time->format('H:i'),
                    'status' => $attendance ? $attendance->status : 'not_recorded',
                ];
            });

            $presentCount = $lectureList->where('status', 'present')->count();
            $absentCount = $lectureList->where('status', 'absent')->count();
            $totalLectures = $lectureList->count();
            $attendanceRate = $totalLectures > 0 ? round(($presentCount / $totalLectures) * 100) : 0;

            // 2. Exams Data
            $examsInPeriod = Exam::where('teacher_id', $teacherId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->with(['results' => function ($q) use ($student) {
                    $q->where('student_id', $student->id);
                }])
                ->get()
                ->map(function ($exam) {
                    $result = $exam->results->first();
                    return [
                        'id' => $exam->id,
                        'title' => $exam->title,
                        'subject' => $exam->subject,
                        'score' => $result ? $result->score : null,
                        'max_score' => $exam->max_score,
                        'percentage' => $result && $exam->max_score > 0 
                            ? round(($result->score / $exam->max_score) * 100) 
                            : null,
                        'status' => $result ? $result->status : 'not_taken',
                        'date' => $exam->created_at->format('Y-m-d'),
                    ];
                });

            $examsTaken = $examsInPeriod->whereNotNull('score')->count();
            $examAverage = $examsInPeriod->whereNotNull('percentage')->avg('percentage') ?? 0;

            // 3. Points Data
            $pointsRecord = StudentPoint::where('student_id', $student->id)
                ->where('teacher_id', $teacherId)
                ->first();

            $totalPoints = $pointsRecord ? $pointsRecord->total_points : 0;
            $weeklyPoints = $pointsRecord ? $pointsRecord->weekly_points : 0;

            // 4. Mistakes Data
            $mistakesStats = $this->mistakesService->getStats($student->id, $teacherId);
            $pendingMistakes = $mistakesStats['pending'] ?? 0;

            // 5. Subscription Status
            $subscriptionEnd = $enrollment->subscription_end;
            $isActive = $enrollment->is_active && ($subscriptionEnd === null || Carbon::parse($subscriptionEnd)->isFuture());
            $daysLeft = $subscriptionEnd ? (int) round(Carbon::now()->diffInDays(Carbon::parse($subscriptionEnd), false)) : null;

            $summary[] = [
                'teacher' => [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'avatar' => $teacher->avatar_key ? $this->imageService->getUrl($teacher->avatar_key) : null,
                ],
                'grade' => $enrollment->grade?->name,
                'group' => $enrollment->group?->name,
                'period' => [
                    'type' => $period,
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d'),
                ],
                'attendance' => [
                    'total_lectures' => $totalLectures,
                    'present' => $presentCount,
                    'absent' => $absentCount,
                    'rate' => $attendanceRate,
                    'list' => $lectureList->values(),
                ],
                'exams' => [
                    'list' => $examsInPeriod->values(),
                    'total' => $examsInPeriod->count(),
                    'taken' => $examsTaken,
                    'average' => round($examAverage, 1),
                ],
                'points' => [
                    'total' => $totalPoints,
                    'weekly' => $weeklyPoints,
                ],
                'mistakes' => [
                    'pending' => $pendingMistakes,
                ],
                'subscription' => [
                    'is_active' => $isActive,
                    'end_date' => $subscriptionEnd,
                    'days_left' => $daysLeft,
                ],
            ];
        }

        return $this->successResponse([
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
            ],
            'date' => $date->format('Y-m-d'),
            'period' => $period,
            'teachers' => $summary,
        ]);
    }
}
