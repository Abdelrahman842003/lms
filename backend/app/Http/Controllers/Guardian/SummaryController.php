<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\Lecture;
use App\Models\Exam;
use App\Models\Attendance;
use App\Models\StudentPoint;
use App\Services\Media\ImageService;
use App\Services\MistakesService;
use App\Http\Requests\Guardian\Summary\GuardianSummaryRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SummaryController extends Controller
{
    public function __construct(
        private MistakesService $mistakesService,
        private ImageService $imageService,
        private \App\Services\Guardian\GuardianSummaryService $summaryService
    ) {}

    /**
     * Get summary for a specific child across all teachers or a specific teacher
     */
    public function index(GuardianSummaryRequest $request, string $studentId)
    {
        $parent = $request->user();
        
        if (!$parent || !$parent->phone) {
            return $this->errorResponse('غير مصرح', 401);
        }

        // Verify this student belongs to this parent
        $student = Student::where('id', $studentId)
            ->where('parent_phone', $parent->phone)
            ->first();

        if (!$student) {
            return $this->errorResponse('الطالب غير موجود أو غير مسموح لك بعرض بياناته', 403);
        }

        $validated = $request->validated();

        $date = Carbon::parse($validated['date'] ?? now());
        $period = $validated['period'] ?? 'day';
        $teacherId = $validated['teacher_id'] ?? null;

        // Get enrollments (optionally filtered by teacher)
        $enrollmentsQuery = Enrollment::where('student_id', $student->id)
            ->where('is_active', true)
            ->with(['teacher', 'grade', 'group']);

        if ($teacherId) {
            $enrollmentsQuery->where('teacher_id', $teacherId);
        }

        $enrollments = $enrollmentsQuery->get();

        $summary = [];

        foreach ($enrollments as $enrollment) {
            $teacher = $enrollment->teacher;
            
            // Skip suspended teachers
            if ($teacher->is_suspended) {
                continue;
            }

            $currentTeacherId = $teacher->id;

            // Calculate date range
            if ($period === 'day') {
                $startDate = $date->copy()->startOfDay();
                $endDate = $date->copy()->endOfDay();
            } else {
                $startDate = $date->copy()->startOfMonth();
                $endDate = $date->copy()->endOfMonth();
            }

            // Use service to get data
            $attendanceData = $this->summaryService->getAttendanceData($currentTeacherId, $student->id, $startDate, $endDate);
            $examsData = $this->summaryService->getExamsData($currentTeacherId, $student->id, $startDate, $endDate);
            $rankingData = $this->summaryService->getRankingData($currentTeacherId, $student->id);

            // 6. Subscription Status
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
                    'total_lectures' => $attendanceData['total'],
                    'present' => $attendanceData['present'],
                    'absent' => $attendanceData['absent'],
                    'rate' => $attendanceData['percentage'],
                    'list' => $attendanceData['details'],
                ],
                'exams' => [
                    'list' => $examsData['details'],
                    'total' => $examsData['total'],
                    'taken' => $examsData['attended'],
                    'average' => $examsData['average_score'],
                ],
                'ranking' => [
                    'position' => $rankingData['rank'],
                    'total' => $rankingData['total_students'],
                ],
                'subscription' => [
                    'is_active' => $isActive,
                    'end_date' => $subscriptionEnd,
                    'days_left' => $daysLeft,
                ],
            ];
        }

        return $this->successResponse([
            'child' => [
                'id' => $student->id,
                'name' => $student->name,
                'avatar' => $student->avatar_key ? $this->imageService->getUrl($student->avatar_key) : null,
            ],
            'date' => $date->format('Y-m-d'),
            'period' => $period,
            'teachers' => $summary,
        ]);
    }
}
