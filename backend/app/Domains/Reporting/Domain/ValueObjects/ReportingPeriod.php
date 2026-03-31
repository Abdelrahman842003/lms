<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\ValueObjects;

use App\Domains\Reporting\Domain\Enums\GranularityHint;
use App\Domains\Reporting\Domain\Enums\ReportingPeriodPreset;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use DateTimeZone;
use InvalidArgumentException;

final readonly class ReportingPeriod
{
    public CarbonImmutable $startAt;

    public CarbonImmutable $endAt;

    public DateTimeZone $timezone;

    public ?ReportingPeriodPreset $preset;

    public GranularityHint $granularityHint;

    public function __construct(
        CarbonInterface $startAt,
        CarbonInterface $endAt,
        DateTimeZone|string $timezone = 'UTC',
        ?ReportingPeriodPreset $preset = null,
        ?GranularityHint $granularityHint = null,
    ) {
        $tz = is_string($timezone) ? new DateTimeZone($timezone) : $timezone;

        $this->startAt = CarbonImmutable::instance($startAt)->setTimezone($tz)->startOfDay();
        $this->endAt = CarbonImmutable::instance($endAt)->setTimezone($tz)->endOfDay();
        $this->timezone = $tz;
        $this->preset = $preset;
        $this->granularityHint = $granularityHint ?? $this->inferGranularity();

        if ($this->startAt->isAfter($this->endAt)) {
            throw new InvalidArgumentException('start_at must be before or equal to end_at');
        }
    }

    public static function fromPreset(
        ReportingPeriodPreset $preset,
        DateTimeZone|string $timezone = 'UTC',
    ): self {
        $tz = is_string($timezone) ? new DateTimeZone($timezone) : $timezone;
        $now = CarbonImmutable::now($tz);

        [$start, $end] = match ($preset) {
            ReportingPeriodPreset::Today => [$now->startOfDay(), $now->endOfDay()],
            ReportingPeriodPreset::Last7Days => [$now->subDays(6)->startOfDay(), $now->endOfDay()],
            ReportingPeriodPreset::ThisMonth => [$now->startOfMonth(), $now->endOfMonth()],
            ReportingPeriodPreset::LastMonth => [$now->subMonthNoOverflow()->startOfMonth(), $now->subMonthNoOverflow()->endOfMonth()],
            ReportingPeriodPreset::Last3Months => [$now->subMonthsNoOverflow(2)->startOfMonth(), $now->endOfMonth()],
            ReportingPeriodPreset::ThisYear => [$now->startOfYear(), $now->endOfYear()],
            ReportingPeriodPreset::CustomRange => throw new InvalidArgumentException('Use fromCustomRange() for custom ranges'),
        };

        return new self($start, $end, $tz, $preset);
    }

    public static function fromCustomRange(
        CarbonInterface $startAt,
        CarbonInterface $endAt,
        DateTimeZone|string $timezone = 'UTC',
        ?GranularityHint $granularityHint = null,
    ): self {
        return new self($startAt, $endAt, $timezone, ReportingPeriodPreset::CustomRange, $granularityHint);
    }

    public function includes(CarbonInterface $date): bool
    {
        $d = CarbonImmutable::instance($date)->setTimezone($this->timezone);

        return $d->between($this->startAt, $this->endAt);
    }

    public function durationInDays(): int
    {
        return (int) $this->startAt->diffInDays($this->endAt) + 1;
    }

    public function toDateTimeString(): string
    {
        return "{$this->startAt->toDateTimeString()} — {$this->endAt->toDateTimeString()}";
    }

    private function inferGranularity(): GranularityHint
    {
        if ($this->preset) {
            return match ($this->preset) {
                ReportingPeriodPreset::Today => GranularityHint::Day,
                ReportingPeriodPreset::Last7Days => GranularityHint::Day,
                ReportingPeriodPreset::ThisMonth => GranularityHint::Day,
                ReportingPeriodPreset::LastMonth => GranularityHint::Day,
                ReportingPeriodPreset::Last3Months => GranularityHint::Week,
                ReportingPeriodPreset::ThisYear => GranularityHint::Month,
                ReportingPeriodPreset::CustomRange => $this->inferGranularityFromRange(),
            };
        }

        return $this->inferGranularityFromRange();
    }

    private function inferGranularityFromRange(): GranularityHint
    {
        $days = $this->durationInDays();

        if ($days <= 31) {
            return GranularityHint::Day;
        }

        if ($days <= 186) {
            return GranularityHint::Week;
        }

        return GranularityHint::Month;
    }
}
