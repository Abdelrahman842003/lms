<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services;

use App\Domains\Reporting\Domain\DTO\KpiCardResult;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;

final class KpiCardFactory
{
    public function __construct(
        private readonly TrendCalculationService $trendService,
    ) {}

    public function make(
        string $key,
        string $title,
        float|int $currentValue,
        float|int|null $baselineValue = null,
        ?string $statusColor = null,
        ?string $note = null,
        ?string $drilldownKey = null,
    ): KpiCardResult {
        $trend = $this->trendService->calculate($currentValue, $baselineValue);

        return new KpiCardResult(
            key: $key,
            title: $title,
            currentValue: $currentValue,
            baselineValue: $baselineValue,
            changePct: $trend['change_pct'],
            direction: $trend['direction'],
            statusColor: $statusColor,
            note: $note,
            drilldownKey: $drilldownKey,
        );
    }

    public function makeFromMetric(
        string $key,
        string $title,
        float|int $currentValue,
        float|int|null $baselineValue,
        ?ReportFilters $filters = null,
        ?string $drilldownKey = null,
    ): KpiCardResult {
        return $this->make(
            key: $key,
            title: $title,
            currentValue: $currentValue,
            baselineValue: $baselineValue,
            drilldownKey: $drilldownKey ?? "{$key}_drilldown",
        );
    }
}
