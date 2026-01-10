<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Services\Academy\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    /**
     * Get academy dashboard statistics
     */
    public function getStats(Request $request): JsonResponse
    {
        $academy = $request->user();

        $stats = $this->dashboardService->getStats($academy);

        return $this->successResponse($stats);
    }
}
