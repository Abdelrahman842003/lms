<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Gamification\Services\PointService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GamificationController extends Controller
{
    protected PointService $pointService;

    public function __construct(PointService $pointService)
    {
        $this->pointService = $pointService;
    }

    /**
     * Get the academy from the authenticated user or secretary
     */
    protected function getAcademy(Request $request): ?\App\Domains\Auth\Models\Academy
    {
        $user = Auth::user();
        
        if ($user instanceof \App\Domains\Auth\Models\Academy) {
            return $user;
        }
        
        // Secretary case - get academy via relationship
        if ($user instanceof \App\Domains\Auth\Models\Secretary) {
            return $user->academies()->first();
        }
        
        return null;
    }

    public function leaderboard(Request $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }
        
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
