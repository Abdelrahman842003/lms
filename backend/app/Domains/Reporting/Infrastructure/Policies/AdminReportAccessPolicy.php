<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Reporting\Domain\Contracts\ReportAccessPolicy;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use Illuminate\Support\Facades\Auth;

final class AdminReportAccessPolicy implements ReportAccessPolicy
{
    public function canViewReport(int $userId, ReportFilters $filters): bool
    {
        return $this->isAdminUser($userId);
    }

    public function canDrillDown(int $userId, string $drilldownKey, ReportFilters $filters): bool
    {
        return $this->isAdminUser($userId);
    }

    public function canExport(int $userId, ReportFilters $filters): bool
    {
        return $this->isAdminUser($userId);
    }

    private function isAdminUser(int $userId): bool
    {
        $user = Auth::guard('admin')->user();

        return $user instanceof Admin && (int) $user->id === $userId;
    }
}
