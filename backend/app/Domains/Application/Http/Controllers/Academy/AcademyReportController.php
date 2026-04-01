<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Reporting\Application\Actions\BuildAcademyReportContextAction;
use App\Domains\Reporting\Application\Builders\Academy\AcademySnapshotBuilder;
use App\Domains\Reporting\Application\Builders\Academy\StudentDistributionBuilder;
use App\Domains\Reporting\Application\Builders\Academy\TeacherPerformanceBuilder;
use App\Domains\Reporting\Application\Builders\Academy\AttendanceQualityBuilder;
use App\Domains\Reporting\Application\Builders\Academy\SessionExecutionBuilder;
use App\Domains\Reporting\Application\Builders\Academy\SubscriptionUsageBuilder;
use App\Domains\Reporting\Application\Builders\Academy\TimeComparisonBuilder;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademyAlertDataProvider;
use App\Domains\Reporting\Presentation\Requests\AcademyReportRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;use Illuminate\Support\Facades\Auth;

class AcademyReportController extends Controller
{
    public function __construct(
        private readonly BuildAcademyReportContextAction $buildContext,
        private readonly AcademySnapshotBuilder $snapshotBuilder,
        private readonly StudentDistributionBuilder $studentDistributionBuilder,
        private readonly TeacherPerformanceBuilder $teacherPerformanceBuilder,
        private readonly AttendanceQualityBuilder $attendanceQualityBuilder,
        private readonly SessionExecutionBuilder $sessionExecutionBuilder,
        private readonly SubscriptionUsageBuilder $subscriptionUsageBuilder,
        private readonly TimeComparisonBuilder $timeComparisonBuilder,
        private readonly AcademyAlertDataProvider $alertDataProvider,
    ) {}

    protected function getAcademy(Request $request): ?Academy
    {
        $user = Auth::user();

        if ($user instanceof Academy) {
            return $user;
        }

        if ($user instanceof Secretary) {
            return $user->academies()->first();
        }

        return null;
    }

    public function snapshot(AcademyReportRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (! $academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $filters = $this->buildContext->execute($request->filters());

        $result = $this->snapshotBuilder->build($academy, $filters);

        return $this->successResponse($result);
    }

    public function studentDistribution(AcademyReportRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);        if (! $academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $filters = $this->buildContext->execute($request->filters());

        $result = $this->studentDistributionBuilder->build($academy, $filters);

        return $this->successResponse($result);
    }

    public function teacherPerformance(AcademyReportRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (! $academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $filters = $this->buildContext->execute($request->filters());

        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 15);
        $sortColumn = $request->input('sort_column', 'linked_students');
        $sortDirection = $request->input('sort_direction', 'desc');

        $result = $this->teacherPerformanceBuilder->build(
            $academy,
            $filters,
            $page,
            $perPage,
            $sortColumn,
            $sortDirection
        );

        return $this->successResponse($result);
    }

    public function attendanceQuality(AcademyReportRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (! $academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $filters = $this->buildContext->execute($request->filters());

        $result = $this->attendanceQualityBuilder->build($academy, $filters);

        return $this->successResponse($result);
    }

    public function sessionExecution(AcademyReportRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (! $academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $filters = $this->buildContext->execute($request->filters());

        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 15);

        $result = $this->sessionExecutionBuilder->build($academy, $filters, $page, $perPage);

        return $this->successResponse($result);
    }

    public function subscriptionUsage(AcademyReportRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (! $academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $result = $this->subscriptionUsageBuilder->build($academy);

        return $this->successResponse($result);
    }

    public function timeComparison(AcademyReportRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (! $academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $filters = $this->buildContext->execute($request->filters());

        $result = $this->timeComparisonBuilder->build($academy, $filters);

        return $this->successResponse($result);
    }

    public function alerts(AcademyReportRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (! $academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $filters = $this->buildContext->execute($request->filters());

        $result = $this->alertDataProvider->getAlerts($academy, $filters);

        return $this->successResponse($result);
    }

    public function overview(AcademyReportRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (! $academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $filters = $this->buildContext->execute($request->filters());

        $snapshot = $this->snapshotBuilder->build($academy, $filters);
        $alerts = $this->alertDataProvider->getAlerts($academy, $filters);

        $criticalCount = count(array_filter($alerts, fn ($a) => $a['severity'] === 'critical'));
        $warningCount = count(array_filter($alerts, fn ($a) => $a['severity'] === 'warning'));
        $infoCount = count(array_filter($alerts, fn ($a) => $a['severity'] === 'info'));

        return $this->successResponse([
            'snapshot' => $snapshot,
            'alerts_summary' => [
                'total' => count($alerts),
                'critical' => $criticalCount,
                'warning' => $warningCount,
                'info' => $infoCount,
            ],
            'highlights' => array_slice($snapshot['kpis'], 0, 4),
        ]);
    }
}
