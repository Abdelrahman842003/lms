<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Export;

use App\Domains\Reporting\Domain\DTO\ExportPayload;
use App\Domains\Reporting\Domain\DTO\KpiCardResult;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;

final readonly class ExportPayloadBuilder
{
    /**
     * @param  array<int, KpiCardResult>  $summaryKpis
     * @param  array<string, mixed>  $breakdownData
     * @param  array<int, array<string, mixed>>  $detailedRows
     */
    public function build(
        array $summaryKpis,
        array $breakdownData,
        array $detailedRows,
        ReportFilters $filters,
    ): ExportPayload {
        return new ExportPayload(
            summaryKpis: $summaryKpis,
            breakdownData: $breakdownData,
            detailedRows: $detailedRows,
            appliedFilterMetadata: $this->buildFilterMetadata($filters),
        );
    }

    private function buildFilterMetadata(ReportFilters $filters): array
    {
        return [
            'preset' => $filters->period->preset?->value,
            'start_at' => $filters->period->startAt->toIso8601String(),
            'end_at' => $filters->period->endAt->toIso8601String(),
            'timezone' => $filters->period->timezone->getName(),
            'comparison_mode' => $filters->comparisonMode?->value,
            'comparison_period' => $filters->comparisonPeriod ? [
                'start_at' => $filters->comparisonPeriod->startAt->toIso8601String(),
                'end_at' => $filters->comparisonPeriod->endAt->toIso8601String(),
                'mode' => $filters->comparisonPeriod->mode->value,
            ] : null,
            'exported_at' => now()->toIso8601String(),
        ];
    }
}
