<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\Dashboard\StudentDashboardRequest;
use App\Http\Resources\Student\DashboardResource;
use App\Services\Student\MistakesService;
use App\Services\Student\StudentDashboardService;
use Illuminate\Http\JsonResponse;

class StudentDashboardController extends Controller
{
    public function __construct(
        private MistakesService $mistakesService,
        private StudentDashboardService $dashboardService
    ) {}

    public function getDashboard(StudentDashboardRequest $request): JsonResponse
    {
        // Validation handled by FormRequest

        $student = $request->user();
        $teacherId = $request->teacher_id;

        // Validate Teacher & Enrollment Status
        $validationResult = $this->dashboardService->validateTeacherAndGetEnrollment($student, $teacherId);
        
        if (!$validationResult) {
             return $this->errorResponse('المدرس غير موجود أو تم تعليقه', 403);
        }

        $enrollment = $validationResult['enrollment'];

        // Get mistakes count (unmastered)
        $mistakesStats = $this->mistakesService->getStats($student->id, $teacherId);
        $mistakesCount = $mistakesStats['pending'] ?? 0;

        // Get total points
        $totalPoints = $this->dashboardService->getStudentPoints($student, $teacherId);

        // Get teacher stats
        $teacherStats = $this->dashboardService->getTeacherStats($student, $teacherId);

        // Get upcoming lectures
        $upcomingLectures = $this->dashboardService->getUpcomingLectures($teacherId, 3);

        // Get latest news (mixed feed of attendance and exams)
        $latestNews = $this->dashboardService->getLatestNews($student, $teacherId, 5);

        return $this->successResponse([
            'stats' => [
                'walletBalance' => $enrollment->balance,
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
