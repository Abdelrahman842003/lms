<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders;

use App\Domains\Reporting\Domain\DTO\KpiCardResult;
use App\Domains\Reporting\Domain\Services\KpiCardFactory;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;

final readonly class SummaryBuilder
{
    public function __construct(
        private KpiCardFactory $kpiFactory,
    ) {}

    /**
     * @param  array<int, array{key: string, title: string, current: float|int, baseline: float|int|null, status_color?: string|null, note?: string|null, drilldown_key?: string|null}>  $metricDefinitions
     * @return array<int, KpiCardResult>
     */
    public function build(array $metricDefinitions, ?ReportFilters $filters = null): array
    {
        return array_map(
            fn (array $def) => $this->kpiFactory->make(
                key: $def['key'],
                title: $def['title'],
                currentValue: $def['current'],
                baselineValue: $def['baseline'] ?? null,
                statusColor: $def['status_color'] ?? null,
                note: $def['note'] ?? null,
                drilldownKey: $def['drilldown_key'] ?? null,
            ),
            $metricDefinitions,
        );
    }
}
