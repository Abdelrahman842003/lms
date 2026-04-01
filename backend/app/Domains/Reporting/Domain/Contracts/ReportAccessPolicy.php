<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Contracts;

use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;

interface ReportAccessPolicy
{
    public function canViewReport(int $userId, ReportFilters $filters): bool;

    public function canDrillDown(int $userId, string $drilldownKey, ReportFilters $filters): bool;

    public function canExport(int $userId, ReportFilters $filters): bool;
}
