<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Gamification\AwardBonusRequest;
use App\Http\Requests\Teacher\Gamification\UpdateGamificationSettingsRequest;
use App\Models\GamificationSetting;
use App\Models\Student;
use App\Services\PointService;
use App\Traits\ResolvesTeacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    use ResolvesTeacher;

    public function __construct(
        private PointService $pointService
    ) {}

    /**
     * Get leaderboard for teacher's students
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = (int) $request->input('per_page', 15);
        $academyId = $request->header('X-Academy-Id');
        
        $weeklyLeaderboard = $this->pointService->getWeeklyLeaderboardPaginated($teacher->id, $perPage, $academyId);
        $allTimeLeaderboard = $this->pointService->getAllTimeLeaderboardPaginated($teacher->id, $perPage, $academyId);

        return $this->successResponse([
            'weekly' => $weeklyLeaderboard,
            'all_time' => $allTimeLeaderboard,
        ]);
    }

    /**
     * Get gamification settings
     */
    public function settings(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $settings = GamificationSetting::getOrCreate($teacher->id);

        return $this->successResponse($settings);
    }

    /**
     * Update gamification settings
     */
    public function updateSettings(UpdateGamificationSettingsRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        $settings = GamificationSetting::getOrCreate($teacher->id);
        $settings->update($request->validated());

        return $this->successResponse($settings->fresh(), 'تم تحديث إعدادات النقاط');
    }

    /**
     * Award manual bonus points to a student
     */
    public function awardBonus(AwardBonusRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $data = $request->validated();

        $student = Student::findOrFail($data['student_id']);
        
        $enrollment = $student->enrollmentFor($teacher);
        if (!$enrollment) {
            return $this->errorResponse('الطالب غير مشترك معك', 403);
        }

        $transaction = $this->pointService->awardManualBonus(
            $student,
            $teacher,
            (int) $data['points'],
            $data['description']
        );

        return $this->successResponse($transaction, "تم منح {$data['points']} نقطة للطالب {$student->name}");
    }

    /**
     * Get student's points details
     */
    public function studentPoints(Request $request, string $studentId): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        $stats = $this->pointService->getStudentStats($studentId, $teacher->id);

        return $this->successResponse($stats);
    }
}
