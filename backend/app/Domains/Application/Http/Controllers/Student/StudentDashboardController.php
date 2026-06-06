<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Student\Dashboard\StudentDashboardRequest;
use App\Domains\Application\Http\Resources\Student\DashboardResource;
use App\Domains\Application\Services\Student\MistakesService;
use App\Domains\Application\Services\Student\StudentDashboardService;
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
        $teacherProfileId = $request->teacher_profile_id;

        // Validate Teacher & Enrollment Status
        $validationResult = $this->dashboardService->validateTeacherAndGetEnrollment($student, $teacherProfileId);
        
        if (!$validationResult) {
             return $this->errorResponse('المدرس غير موجود أو تم تعليقه', 403);
        }

        $enrollment = $validationResult['enrollment'];

        // Get mistakes count (unmastered)
        $mistakesStats = $this->mistakesService->getStats($student->id, $teacherProfileId);
        $mistakesCount = $mistakesStats['pending'] ?? 0;

        // Get total points
        $totalPoints = $this->dashboardService->getStudentPoints($student, $teacherProfileId);

        // Get teacher stats
        $teacherStats = $this->dashboardService->getTeacherStats($student, $teacherProfileId);

        // Get upcoming lectures
        $upcomingLectures = $this->dashboardService->getUpcomingLectures($teacherProfileId, 3);

        // Get latest news (mixed feed of attendance and exams)
        $latestNews = $this->dashboardService->getLatestNews($student, $teacherProfileId, 5);

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
