<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Services\Academy\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $service
    ) {}

    /**
     * Get academy dashboard statistics
     */
    public function getStats(Request $request): JsonResponse
    {
        $academy = $request->user();

        $stats = $this->service->getStats($academy);

        return $this->successResponse($stats);
    }
}
