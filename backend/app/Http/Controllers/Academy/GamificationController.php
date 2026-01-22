<?php

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Services\PointService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    protected PointService $pointService;

    public function __construct(PointService $pointService)
    {
        $this->pointService = $pointService;
    }

    public function leaderboard(Request $request): JsonResponse
    {
        $academy = $request->user(); // Assuming authenticated as Academy
        $perPage = (int) $request->input('per_page', 15);
        $gradeId = $request->input('grade_id');
        $groupId = $request->input('group_id');
        $gradeName = $request->input('grade_name');

        $weeklyLeaderboard = $this->pointService->getAcademyWeeklyLeaderboardPaginated($academy->id, $perPage, $gradeId, $groupId, $gradeName);
        $allTimeLeaderboard = $this->pointService->getAcademyAllTimeLeaderboardPaginated($academy->id, $perPage, $gradeId, $groupId, $gradeName);

        return response()->json([
            'status' => true,
            'data' => [
                'weekly' => $weeklyLeaderboard,
                'all_time' => $allTimeLeaderboard,
            ],
        ]);
    }
}
