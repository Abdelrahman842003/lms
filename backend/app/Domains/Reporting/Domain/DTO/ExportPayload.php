<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\DTO;

final readonly class ExportPayload
{
    /**
     * @param  array<int, KpiCardResult>  $summaryKpis
     * @param  array<string, mixed>  $breakdownData
     * @param  array<int, array<string, mixed>>  $detailedRows
     * @param  array<string, mixed>  $appliedFilterMetadata
     */
    public function __construct(
        public array $summaryKpis,
        public array $breakdownData,
        public array $detailedRows,
        public array $appliedFilterMetadata,
    ) {}

    public function toArray(): array
    {
        return [
            'summary_kpis' => array_map(fn (KpiCardResult $kpi): array => $kpi->toArray(), $this->summaryKpis),
            'breakdown_data' => $this->breakdownData,
            'detailed_rows' => $this->detailedRows,
            'applied_filter_metadata' => $this->appliedFilterMetadata,
        ];
    }
}
