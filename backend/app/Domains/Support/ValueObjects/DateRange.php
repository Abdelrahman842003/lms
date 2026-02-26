<?php

declare(strict_types=1);

namespace App\Domains\Support\ValueObjects;

use Carbon\CarbonImmutable;
use InvalidArgumentException;

/**
 * Value Object يمثل نطاق زمني (تاريخ بداية + نهاية).
 * Immutable — لا يمكن تعديله بعد الإنشاء.
 */
final readonly class DateRange
{
    public function __construct(
        public CarbonImmutable $startDate,
        public CarbonImmutable $endDate,
    ) {
        if ($this->endDate->isBefore($this->startDate)) {
            throw new InvalidArgumentException(
                'تاريخ النهاية يجب أن يكون بعد تاريخ البداية.'
            );
        }
    }

    public static function fromStrings(string $start, string $end): self
    {
        return new self(
            CarbonImmutable::parse($start),
            CarbonImmutable::parse($end),
        );
    }

    public function daysCount(): int
    {
        return (int) $this->startDate->diffInDays($this->endDate);
    }

    public function contains(CarbonImmutable $date): bool
    {
        return $date->betweenIncluded($this->startDate, $this->endDate);
    }

    public function isActive(): bool
    {
        return $this->contains(CarbonImmutable::now());
    }

    public function isExpired(): bool
    {
        return CarbonImmutable::now()->isAfter($this->endDate);
    }

    public function toArray(): array
    {
        return [
            'start_date' => $this->startDate->toDateString(),
            'end_date'   => $this->endDate->toDateString(),
        ];
    }

    public function __toString(): string
    {
        return "{$this->startDate->toDateString()} → {$this->endDate->toDateString()}";
    }
}
