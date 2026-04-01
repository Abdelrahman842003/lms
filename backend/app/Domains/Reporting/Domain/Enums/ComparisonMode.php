<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Enums;

enum ComparisonMode: string
{
    case PreviousPeriod = 'previous_period';
    case SamePeriodLastYear = 'same_period_last_year';

    public function label(): string
    {
        return match ($this) {
            self::PreviousPeriod => 'Previous Period',
            self::SamePeriodLastYear => 'Same Period Last Year',
        };
    }
}
