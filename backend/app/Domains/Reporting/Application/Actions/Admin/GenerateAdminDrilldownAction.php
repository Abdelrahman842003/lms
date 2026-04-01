<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Actions\Admin;

use App\Domains\Reporting\Application\Actions\BuildReportContextAction;
use App\Domains\Reporting\Application\Builders\BreakdownBuilder;
use App\Domains\Reporting\Domain\Contracts\ReportAccessPolicy;
use App\Domains\Reporting\Domain\Services\DrilldownRegistry;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminAcademySummaryQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminSubscriptionSummaryQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminTeacherSummaryQueryService;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final readonly class GenerateAdminDrilldownAction
{
    private const SERVICE_MAP = [
        'academies_drilldown' => 'academyQuery',
        'teachers_drilldown' => 'teacherQuery',
        'subscription_usage_drilldown' => 'subscriptionQuery',
        'total_students_drilldown' => 'subscriptionQuery',
        'revenue_drilldown' => 'subscriptionQuery',
    ];

    private const SCHEMA_MAP = [
        'academies_drilldown' => [
            'name' => 'string', 'linked_student_count' => 'number', 'teacher_count' => 'number',
            'plan_type' => 'string', 'is_unlimited_students' => 'boolean', 'created_at' => 'date',
        ],
        'teachers_drilldown' => [
            'name' => 'string', 'active_student_count' => 'number', 'plan_type' => 'string',
            'is_unlimited_students' => 'boolean', 'created_at' => 'date',
        ],
        'subscription_usage_drilldown' => [
            'subscriber_type' => 'string', 'type' => 'string', 'status' => 'string',
            'seats_count' => 'number', 'quota_limit' => 'number', 'amount_paid' => 'number',
            'month' => 'date', 'created_at' => 'datetime',
        ],
        'total_students_drilldown' => [
            'subscriber_type' => 'string', 'type' => 'string', 'status' => 'string',
            'seats_count' => 'number', 'quota_limit' => 'number', 'month' => 'date',
        ],
        'revenue_drilldown' => [
            'subscriber_type' => 'string', 'type' => 'string', 'status' => 'string',
            'amount_paid' => 'number', 'amount_due' => 'number', 'month' => 'date',
        ],
    ];

    public function __construct(
        private BuildReportContextAction $buildContext,
        private ReportAccessPolicy $accessPolicy,
        private DrilldownRegistry $drilldownRegistry,
        private AdminAcademySummaryQueryService $academyQuery,
        private AdminTeacherSummaryQueryService $teacherQuery,
        private AdminSubscriptionSummaryQueryService $subscriptionQuery,
        private BreakdownBuilder $breakdownBuilder,
    ) {}

    public function execute(string $key, array $input, int $page = 1, int $perPage = 15): array
    {
        if (!$this->drilldownRegistry->has($key)) {
            throw new NotFoundHttpException("Drill-down key '{$key}' not found.");
        }

        $filters = $this->buildContext->execute($input);

        $userId = (int) Auth::guard('admin')->id();

        if (!$this->accessPolicy->canDrillDown($userId, $key, $filters)) {
            throw new \Illuminate\Auth\Access\AuthorizationException('You do not have permission to access this drill-down.');
        }

        $sortColumn = $input['sort_column'] ?? 'created_at';
        $sortDirection = $input['sort_direction'] ?? 'desc';

        $paginator = $this->resolveData($key, $filters, $page, $perPage, $sortColumn, $sortDirection);

        $schema = self::SCHEMA_MAP[$key] ?? [];

        $rows = $paginator->items();
        $mappedRows = array_map(fn ($item) => (array) $item, $rows);

        return $this->breakdownBuilder->build(
            rows: $mappedRows,
            schema: $schema,
            sort: ['column' => $sortColumn, 'direction' => $sortDirection],
            page: $page,
            perPage: $perPage,
        );
    }

    private function resolveData(string $key, $filters, int $page, int $perPage, string $sortColumn, string $sortDirection)
    {
        $serviceProperty = self::SERVICE_MAP[$key] ?? null;

        if ($serviceProperty === null) {
            throw new NotFoundHttpException("No query service mapped for drill-down key '{$key}'.");
        }

        return match ($serviceProperty) {
            'academyQuery' => $this->academyQuery->getPaginatedSummary($filters, $page, $perPage, $sortColumn, $sortDirection),
            'teacherQuery' => $this->teacherQuery->getPaginatedSummary($filters, $page, $perPage, $sortColumn, $sortDirection),
            'subscriptionQuery' => $this->subscriptionQuery->getPaginatedSummary($filters, $page, $perPage, $sortColumn, $sortDirection),
        };
    }
}
