<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Enums;

enum GranularityHint: string
{
    case Day = 'day';
    case Week = 'week';
    case Month = 'month';

    public function label(): string
    {
        return match ($this) {
            self::Day => 'Day',
            self::Week => 'Week',
            self::Month => 'Month',
        };
    }
}
