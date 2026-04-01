<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Actions\Admin;

use App\Domains\Reporting\Application\Builders\Admin\AdminExecutiveSnapshotBuilder;
use App\Domains\Reporting\Application\Builders\Admin\AdminRevenueTrendBuilder;
use App\Domains\Reporting\Application\Builders\Admin\AdminSubscriptionHealthBuilder;
use App\Domains\Reporting\Application\Builders\Admin\AdminPlanBreakdownBuilder;
use App\Domains\Reporting\Application\Builders\Admin\AdminEntityPerformanceBuilder;
use App\Domains\Reporting\Application\Builders\Admin\AdminAlertContextBuilder;
use App\Domains\Reporting\Domain\Contracts\ReportAccessPolicy;
use App\Domains\Reporting\Domain\DTO\KpiCardResult;
use App\Domains\Reporting\Domain\Services\AlertEngine;
use App\Domains\Reporting\Domain\Services\DrilldownRegistry;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Application\Actions\BuildReportContextAction;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminStudentActivityQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminEntityQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminSubscriptionQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminRevenueQueryService;
use App\Domains\Reporting\Infrastructure\Queries\Admin\AdminEntityPerformanceQueryService;
use App\Domains\Reporting\Domain\Services\KpiCardFactory;
use App\Domains\Reporting\Domain\Services\TrendCalculationService;
use App\Domains\Reporting\Application\Builders\BreakdownBuilder;
use Illuminate\Support\Facades\Auth;

final readonly class GenerateAdminReportAction
{
    public function __construct(
        private BuildReportContextAction $buildContext,
        private ReportAccessPolicy $accessPolicy,
        private AlertEngine $alertEngine,
        private DrilldownRegistry $drilldownRegistry,
        private AdminStudentActivityQueryService $studentQuery,
        private AdminEntityQueryService $entityQuery,
        private AdminSubscriptionQueryService $subscriptionQuery,
        private AdminRevenueQueryService $revenueQuery,
        private AdminEntityPerformanceQueryService $entityPerformanceQuery,
        private KpiCardFactory $kpiFactory,
        private TrendCalculationService $trendService,
        private BreakdownBuilder $breakdownBuilder,
    ) {}

    public function execute(array $input): array
    {
        $filters = $this->buildContext->execute($input);

        $userId = (int) Auth::guard('admin')->id();

        if (!$this->accessPolicy->canViewReport($userId, $filters)) {
            throw new \Illuminate\Auth\Access\AuthorizationException('You do not have permission to view admin reports.');
        }

        $snapshotBuilder = new AdminExecutiveSnapshotBuilder(
            $this->kpiFactory,
            $this->entityQuery,
            $this->studentQuery,
            $this->subscriptionQuery,
            $this->revenueQuery,
        );

        $summary = $snapshotBuilder->build($filters);

        $sections = $this->buildSections($filters);

        $alertContext = $this->buildAlertContext($filters, $summary, $sections);
        $alerts = $this->alertEngine->evaluate($alertContext);

        $drilldowns = $this->collectDrilldownDescriptors();

        return [
            'meta' => $this->buildMeta($filters),
            'applied_filters' => $filters->toArray(),
            'summary' => array_map(fn (KpiCardResult $kpi): array => $kpi->toArray(), $summary),
            'sections' => $sections,
            'alerts' => $alerts,
            'drilldowns' => $drilldowns,
        ];
    }

    private function buildSections(ReportFilters $filters): array
    {
        $sections = [];

        $revenueBuilder = new AdminRevenueTrendBuilder(
            $this->revenueQuery,
            $this->trendService,
        );
        $sections['revenue_trends'] = $revenueBuilder->build($filters);

        $subscriptionBuilder = new AdminSubscriptionHealthBuilder(
            $this->subscriptionQuery,
            $this->kpiFactory,
        );
        $sections['subscription_health'] = $subscriptionBuilder->build($filters);

        $planBuilder = new AdminPlanBreakdownBuilder(
            $this->revenueQuery,
            $this->subscriptionQuery,
            $this->breakdownBuilder,
        );
        $sections['plan_breakdown'] = $planBuilder->build($filters);

        $entityPerfBuilder = new AdminEntityPerformanceBuilder(
            $this->entityPerformanceQuery,
            $this->breakdownBuilder,
        );
        $sections['entity_performance'] = $entityPerfBuilder->build($filters);

        return $sections;
    }

    private function buildAlertContext(ReportFilters $filters, array $summary, array $sections): array
    {
        $alertContextBuilder = new AdminAlertContextBuilder();
        $alertContextBuilder->setSummary($summary);
        $alertContextBuilder->setSections($sections);
        $alertContextBuilder->setFilters($filters);

        return $alertContextBuilder->build();
    }

    private function collectDrilldownDescriptors(): array
    {
        $descriptors = $this->drilldownRegistry->all();

        return array_map(fn ($descriptor): array => $descriptor->toArray(), $descriptors);
    }

    private function buildMeta(ReportFilters $filters): array
    {
        return [
            'generated_at' => now()->toIso8601String(),
            'timezone' => $filters->period->timezone->getName(),
            'report_scope' => 'platform_admin',
            'version' => '1.0',
        ];
    }
}
