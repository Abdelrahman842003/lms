<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Enums;

enum ReportingPeriodPreset: string
{
    case Today = 'today';
    case Last7Days = 'last_7_days';
    case ThisMonth = 'this_month';
    case LastMonth = 'last_month';
    case Last3Months = 'last_3_months';
    case ThisYear = 'this_year';
    case CustomRange = 'custom_range';

    public function label(): string
    {
        return match ($this) {
            self::Today => 'Today',
            self::Last7Days => 'Last 7 Days',
            self::ThisMonth => 'This Month',
            self::LastMonth => 'Last Month',
            self::Last3Months => 'Last 3 Months',
            self::ThisYear => 'This Year',
            self::CustomRange => 'Custom Range',
        };
    }
}
