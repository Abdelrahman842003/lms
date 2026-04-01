<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Policies;

use App\Domains\Reporting\Domain\Contracts\ReportAccessPolicy;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;

use App\Domains\Auth\Models\Teacher;

final class TeacherReportAccessPolicy implements ReportAccessPolicy
{
    public function canViewReport(int $userId, ReportFilters $filters): bool
    {
        $teacher = Teacher::find($userId);
        return $teacher !== null && $teacher->status->value === 'active';
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
