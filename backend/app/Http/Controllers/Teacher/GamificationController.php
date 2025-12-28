<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\GamificationSetting;
use App\Models\Student;
use App\Services\PointService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GamificationController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    public function __construct(
        private PointService $pointService
    ) {}

    /**
     * Get leaderboard for teacher's students
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = $request->input('per_page', 15);
        
        $weeklyLeaderboard = $this->pointService->getWeeklyLeaderboardPaginated($teacher->id, $perPage);
        $allTimeLeaderboard = $this->pointService->getAllTimeLeaderboardPaginated($teacher->id, $perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'weekly' => $weeklyLeaderboard,
                'all_time' => $allTimeLeaderboard,
            ],
        ]);
    }

    /**
     * Get gamification settings
     */
    public function settings(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $settings = GamificationSetting::getOrCreate($teacher->id);

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update gamification settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $teacher = $request->user();
        
        $validated = $request->validate([
            'attendance_points' => 'sometimes|integer|min:0|max:100',
            'perfect_month_bonus' => 'sometimes|integer|min:0|max:200',
            'exam_max_points' => 'sometimes|integer|min:0|max:100',
            'exam_retake_bonus' => 'sometimes|integer|min:0|max:100',
            'exam_first_place_bonus' => 'sometimes|integer|min:0|max:100',
            'streak_5_bonus' => 'sometimes|integer|min:0|max:100',
            'streak_10_bonus' => 'sometimes|integer|min:0|max:100',
            'is_enabled' => 'sometimes|boolean',
            'show_leaderboard' => 'sometimes|boolean',
            'leaderboard_size' => 'sometimes|integer|min:3|max:20',
        ]);

        $settings = GamificationSetting::getOrCreate($teacher->id);
        $settings->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث إعدادات النقاط',
            'data' => $settings->fresh(),
        ]);
    }

    /**
     * Award manual bonus points to a student
     */
    public function awardBonus(Request $request): JsonResponse
    {
        $teacher = $request->user();
        
        $validated = $request->validate([
            'student_id' => ['required', 'uuid', Rule::exists('students', 'id')],
            'points' => 'required|integer|min:1|max:1000',
            'description' => 'required|string|max:255',
        ]);

        $student = Student::findOrFail($validated['student_id']);
        
        // Verify student is enrolled with this teacher
        $enrollment = $student->enrollmentFor($teacher);
        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'الطالب غير مشترك معك',
            ], 403);
        }

        $transaction = $this->pointService->awardManualBonus(
            $student,
            $teacher,
            $validated['points'],
            $validated['description']
        );

        return response()->json([
            'success' => true,
            'message' => "تم منح {$validated['points']} نقطة للطالب {$student->name}",
            'data' => $transaction,
        ]);
    }

    /**
     * Get student's points details
     */
    public function studentPoints(Request $request, string $studentId): JsonResponse
    {
        $teacher = $request->user();
        
        $stats = $this->pointService->getStudentStats($studentId, $teacher->id);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
