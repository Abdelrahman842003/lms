<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Admin;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Services\Admin\DashboardService;
use App\Domains\Support\Traits\ApiResponseTrait;

class DashboardController extends Controller
{
    use ApiResponseTrait;

    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index()
    {
        $stats = $this->dashboardService->getStats();
        return $this->successResponse($stats);
    }
}
