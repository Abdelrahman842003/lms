<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Admin;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Reporting\Application\Actions\Admin\ExportAdminReportAction;
use App\Domains\Reporting\Application\Actions\Admin\GenerateAdminDrilldownAction;
use App\Domains\Reporting\Application\Actions\Admin\GenerateAdminReportAction;
use App\Domains\Reporting\Presentation\Resources\Admin\AdminDrilldownResource;
use App\Domains\Reporting\Presentation\Resources\Admin\AdminExportResource;
use App\Domains\Reporting\Presentation\Resources\Admin\AdminReportResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminReportController extends Controller
{
    public function __construct(
        private readonly GenerateAdminReportAction $generateReport,
        private readonly GenerateAdminDrilldownAction $drilldownAction,
        private readonly ExportAdminReportAction $exportAction,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $report = $this->generateReport->execute($request->all());

        return $this->successResponse(
            new AdminReportResource($report),
            'Admin report generated successfully',
        );
    }

    public function drilldown(Request $request, string $key): JsonResponse
    {
        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 15);

        $result = $this->drilldownAction->execute(
            $key,
            $request->all(),
            $page,
            $perPage,
        );

        return $this->successResponse(
            new AdminDrilldownResource($result),
            'Drill-down data retrieved successfully',
        );
    }

    public function export(Request $request): JsonResponse
    {
        $payload = $this->exportAction->execute($request->all());

        return $this->successResponse(
            new AdminExportResource($payload),
            'Admin report exported successfully',
        );
    }
}
