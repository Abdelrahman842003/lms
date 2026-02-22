<?php

declare(strict_types=1);

namespace App\DTO\Reports;

use Carbon\Carbon;

/**
 * DTO for report period information
 */
final readonly class ReportPeriodData
{
    /**
     * @param Carbon $startDate Start date of the report period
     * @param Carbon $endDate End date of the report period
     * @param int $durationMonths Number of months in the period
     */
    public function __construct(
        public Carbon $startDate,
        public Carbon $endDate,
        public int $durationMonths,
    ) {}

    /**
     * Create from array data
     *
     * @param array{start_date: string, end_date: string} $data
     */
    public static function fromArray(array $data): self
    {
        $startDate = Carbon::parse($data['start_date'])->startOfDay();
        $endDate = Carbon::parse($data['end_date'])->endOfDay();

        return new self(
            startDate: $startDate,
            endDate: $endDate,
            durationMonths: $startDate->diffInMonths($endDate) + 1,
        );
    }

    /**
     * Convert to array for API response
     *
     * @return array{start: string, end: string, duration_months: int}
     */
    public function toArray(): array
    {
        return [
            'start' => $this->startDate->format('Y-m-d'),
            'end' => $this->endDate->format('Y-m-d'),
            'duration_months' => $this->durationMonths,
        ];
    }
}
