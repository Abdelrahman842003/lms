<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Admin;

use App\Domains\Reporting\Domain\DTO\KpiCardResult;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;

final class AdminAlertContextBuilder
{
    /** @var array<int, KpiCardResult> */
    private array $summary = [];

    private array $sections = [];

    private ?ReportFilters $filters = null;

    /**
     * @param  array<int, KpiCardResult>  $summary
     */
    public function setSummary(array $summary): self
    {
        $this->summary = $summary;

        return $this;
    }

    public function setSections(array $sections): self
    {
        $this->sections = $sections;

        return $this;
    }

    public function setFilters(ReportFilters $filters): self
    {
        $this->filters = $filters;

        return $this;
    }

    public function build(): array
    {
        $context = [];

        foreach ($this->summary as $kpi) {
            $context[$kpi->key] = [
                'current' => $kpi->currentValue,
                'baseline' => $kpi->baselineValue,
                'change_pct' => $kpi->changePct,
                'direction' => $kpi->direction->value,
            ];
        }

        $this->extractRevenueDropPct($context);
        $this->extractSubscriptionMetrics($context);
        $this->extractEntityPerformanceMetrics($context);

        if ($this->filters) {
            $context['filters'] = $this->filters->toArray();
        }

        return $context;
    }

    private function extractRevenueDropPct(array &$context): void
    {
        $revenueSections = $this->sections['revenue_trends'] ?? [];
        $summary = $revenueSections['summary'] ?? [];

        $current = $summary['current'] ?? 0;
        $baseline = $summary['baseline'] ?? null;
        $direction = $summary['direction'] ?? 'stable';

        if ($baseline !== null && $baseline > 0 && $direction === 'down') {
            $context['revenue_drop_pct'] = abs($summary['change_pct'] ?? 0);
        } else {
            $context['revenue_drop_pct'] = 0;
        }
    }

    private function extractSubscriptionMetrics(array &$context): void
    {
        $subscriptionHealth = $this->sections['subscription_health'] ?? [];
        $usageDistribution = $subscriptionHealth['usage_distribution'] ?? [];

        $totalActive = 0;
        foreach ($subscriptionHealth['kpis'] ?? [] as $kpi) {
            if (($kpi['key'] ?? '') === 'health_active') {
                $totalActive = $kpi['current_value'] ?? 0;
            }
            if (($kpi['key'] ?? '') === 'health_renewals_due') {
                $renewalCount = $kpi['current_value'] ?? 0;
                if ($totalActive > 0 && $renewalCount > 0) {
                    $context['days_until_renewal'] = 30;
                }
            }
        }

        $context['usage_distribution'] = $usageDistribution;

        $planBreakdown = $this->sections['plan_breakdown'] ?? [];
        $rows = $planBreakdown['data'] ?? [];
        $maxUsage = 0;
        foreach ($rows as $row) {
            $usagePct = $row['avg_usage_pct'] ?? $row['usage_pct'] ?? 0;
            if ($usagePct > $maxUsage) {
                $maxUsage = $usagePct;
            }
        }
        $context['usage_percentage'] = $maxUsage;
    }

    private function extractEntityPerformanceMetrics(array &$context): void
    {
        $entityPerformance = $this->sections['entity_performance'] ?? [];

        $topAcademies = $entityPerformance['top_growing_academies']['data'] ?? [];
        $maxGrowth = 0;
        foreach ($topAcademies as $row) {
            $growth = $row['growth_pct'] ?? $row['student_count'] ?? 0;
            if (is_numeric($growth) && $growth > $maxGrowth) {
                $maxGrowth = (float) $growth;
            }
        }
        $context['growth_pct'] = $maxGrowth;

        $attendanceDecline = $entityPerformance['academies_attendance_decline']['data'] ?? [];
        $maxAttendanceDrop = 0;
        foreach ($attendanceDecline as $row) {
            $drop = abs($row['change_pct'] ?? 0);
            if ($drop > $maxAttendanceDrop) {
                $maxAttendanceDrop = $drop;
            }
        }
        $context['attendance_drop_pct'] = $maxAttendanceDrop;

        $totalLinkedStudents = $context['total_linked_students']['current'] ?? 0;
        $totalActiveStudents = $context['active_subscriptions']['current'] ?? 0;
        if ($totalLinkedStudents > 0) {
            $inactivePct = max(0, (1 - ($totalActiveStudents / $totalLinkedStudents)) * 100);
            $context['inactive_percentage'] = round($inactivePct, 1);
        } else {
            $context['inactive_percentage'] = 0;
        }
    }
}
