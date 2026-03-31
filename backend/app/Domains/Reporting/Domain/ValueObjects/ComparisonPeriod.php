<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\ValueObjects;

use App\Domains\Reporting\Domain\Enums\ComparisonMode;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

final readonly class ComparisonPeriod
{
    public CarbonImmutable $startAt;

    public CarbonImmutable $endAt;

    public ComparisonMode $mode;

    public function __construct(
        CarbonInterface $startAt,
        CarbonInterface $endAt,
        ComparisonMode $mode,
    ) {
        $this->startAt = CarbonImmutable::instance($startAt);
        $this->endAt = CarbonImmutable::instance($endAt);
        $this->mode = $mode;
    }

    public static function fromReportingPeriod(
        ReportingPeriod $period,
        ComparisonMode $mode,
    ): self {
        return match ($mode) {
            ComparisonMode::PreviousPeriod => self::previousPeriod($period),
            ComparisonMode::SamePeriodLastYear => self::samePeriodLastYear($period),
        };
    }

    public static function previousPeriod(ReportingPeriod $period): self
    {
        $durationInDays = $period->durationInDays();

        return new self(
            startAt: $period->startAt->subDays($durationInDays)->startOfDay(),
            endAt: $period->startAt->subDay()->endOfDay(),
            mode: ComparisonMode::PreviousPeriod,
        );
    }

    public static function samePeriodLastYear(ReportingPeriod $period): self
    {
        $startLastYear = $period->startAt->subYearNoOverflow()->startOfDay();
        $endLastYear = $period->endAt->subYearNoOverflow()->endOfDay();

        return new self(
            startAt: $startLastYear,
            endAt: $endLastYear,
            mode: ComparisonMode::SamePeriodLastYear,
        );
    }

    public function durationInDays(): int
    {
        return (int) $this->startAt->diffInDays($this->endAt) + 1;
    }

    public function toDateTimeString(): string
    {
        return "{$this->startAt->toDateTimeString()} — {$this->endAt->toDateTimeString()}";
    }
}
