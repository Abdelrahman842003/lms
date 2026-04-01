<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Policies;

use App\Domains\Reporting\Domain\Contracts\ReportAccessPolicy;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;

final class DefaultReportAccessPolicy implements ReportAccessPolicy
{
    public function canViewReport(int $userId, ReportFilters $filters): bool
    {
        return true;
    }

    public function canDrillDown(int $userId, string $drilldownKey, ReportFilters $filters): bool
    {
        return $this->canViewReport($userId, $filters);
    }

    public function canExport(int $userId, ReportFilters $filters): bool
    {
        return $this->canViewReport($userId, $filters);
    }
}
