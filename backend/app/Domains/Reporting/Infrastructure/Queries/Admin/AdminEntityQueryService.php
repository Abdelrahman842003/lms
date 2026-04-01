<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Admin;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\ValueObjects\ComparisonPeriod;

final class AdminEntityQueryService
{
    public function countAcademies(): int
    {
        return Academy::active()->count();
    }

    public function countBaselineAcademies(?ComparisonPeriod $comparisonPeriod): ?int
    {
        if ($comparisonPeriod === null) {
            return null;
        }

        return Academy::query()
            ->where('created_at', '<=', $comparisonPeriod->endAt)
            ->active()
            ->count();
    }

    public function countTeachers(): int
    {
        return Teacher::query()->where('status', 'active')->count();
    }

    public function countBaselineTeachers(?ComparisonPeriod $comparisonPeriod): ?int
    {
        if ($comparisonPeriod === null) {
            return null;
        }

        return Teacher::query()
            ->where('created_at', '<=', $comparisonPeriod->endAt)
            ->where('status', 'active')
            ->count();
    }

    public function countEntitiesNearLimit(float $threshold = 80.0): int
    {
        $academiesNearLimit = Academy::query()
            ->where('is_active', true)
            ->where('is_unlimited_students', false)
            ->get()
            ->filter(fn (Academy $academy) => $academy->getQuotaUsage() >= $threshold)
            ->count();

        $teachersNearLimit = Teacher::query()
            ->where('status', 'active')
            ->where('is_unlimited_students', false)
            ->get()
            ->filter(function (Teacher $teacher) use ($threshold): bool {
                $activeStudents = $teacher->activeStudents()->count();
                $limit = (int) ($teacher->plan_max_students ?? 0);

                if ($limit === 0) {
                    return false;
                }

                return ($activeStudents / $limit) * 100 >= $threshold;
            })
            ->count();

        return $academiesNearLimit + $teachersNearLimit;
    }
}
