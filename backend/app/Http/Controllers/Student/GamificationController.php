<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\GamificationSetting;
use App\Models\PointTransaction;
use App\Models\StudentPoint;
use App\Services\PointService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    public function __construct(
        private PointService $pointService
    ) {}

    /**
     * Get student's points for all teachers
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $points = StudentPoint::where('student_id', $student->id)
            ->with('teacher:id,name,avatar_key')
            ->get()
            ->map(function ($point) {
                $stats = $this->pointService->getStudentStats($point->student_id, $point->teacher_id);
                return [
                    'teacher_id' => $point->teacher_id,
                    'teacher' => $point->teacher,
                    'total_points' => $point->total_points,
                    'weekly_points' => $stats['weekly_points'],
                    'rank' => $stats['rank'],
                    'attendance_streak' => $point->attendance_streak,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $points,
        ]);
    }

    /**
     * Get student's points for a specific teacher
     */
    public function show(Request $request, string $teacherId): JsonResponse
    {
        $student = $request->user();
        $stats = $this->pointService->getStudentStats($student->id, $teacherId);
        
        $settings = GamificationSetting::getOrCreate($teacherId);

        return response()->json([
            'success' => true,
            'data' => [
                'total_points' => $stats['total_points'],
                'weekly_points' => $stats['weekly_points'],
                'rank' => $stats['rank'],
                'attendance_streak' => $stats['attendance_streak'],
                'is_leaderboard_visible' => $settings->show_leaderboard,
            ],
        ]);
    }

    /**
     * Get student's point transaction history
     */
    public function history(Request $request, string $teacherId): JsonResponse
    {
        $student = $request->user();

        $transactions = PointTransaction::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    /**
     * Get weekly leaderboard for a teacher
     */
    public function leaderboard(Request $request, string $teacherId): JsonResponse
    {
        $student = $request->user();
        $settings = GamificationSetting::getOrCreate($teacherId);

        if (!$settings->show_leaderboard) {
            return response()->json([
                'success' => false,
                'message' => 'لوحة الشرف غير متاحة',
            ], 403);
        }

        // Always use default limit from settings (5)
        // Limit to 5 as requested
        $limit = 5;

        $weeklyLeaderboard = $this->pointService->getWeeklyLeaderboard($teacherId, $limit);
        $allTimeLeaderboard = $this->pointService->getAllTimeLeaderboard($teacherId, $limit);
        
        // Get student's own stats
        $myStats = $this->pointService->getStudentStats($student->id, $teacherId);

        return response()->json([
            'success' => true,
            'data' => [
                'weekly' => $weeklyLeaderboard,
                'all_time' => $allTimeLeaderboard,
                'my_stats' => $myStats,
            ],
        ]);
    }
}
