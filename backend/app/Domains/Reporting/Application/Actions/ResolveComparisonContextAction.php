<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Actions;

use App\Domains\Reporting\Domain\Enums\ComparisonMode;
use App\Domains\Reporting\Domain\ValueObjects\ComparisonPeriod;
use App\Domains\Reporting\Domain\ValueObjects\ReportingPeriod;

final readonly class ResolveComparisonContextAction
{
    public function execute(ReportingPeriod $period, ComparisonMode $mode): ComparisonPeriod
    {
        return ComparisonPeriod::fromReportingPeriod($period, $mode);
    }

    public function previousPeriod(ReportingPeriod $period): ComparisonPeriod
    {
        return ComparisonPeriod::previousPeriod($period);
    }

    public function samePeriodLastYear(ReportingPeriod $period): ComparisonPeriod
    {
        return ComparisonPeriod::samePeriodLastYear($period);
    }
}
