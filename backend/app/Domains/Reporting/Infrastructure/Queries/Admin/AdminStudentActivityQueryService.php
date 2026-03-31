<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Admin;

use App\Domains\Auth\Models\Student;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Reporting\Domain\ValueObjects\ComparisonPeriod;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\SharedDateScope;

final class AdminStudentActivityQueryService
{
    public function __construct(
        private readonly SharedDateScope $dateScope,
    ) {}

    public function countLinkedStudents(): int
    {
        return Student::count();
    }

    public function countLinkedStudentsForPeriod(ReportFilters $filters): int
    {
        return Student::query()
            ->whereHas('enrollments', fn ($q) => $this->dateScope->apply($q, $filters->period, 'created_at'))
            ->count();
    }

    public function countActiveStudents(ReportFilters $filters): int
    {
        return Student::query()
            ->whereHas('attendances', fn ($q) => $this->dateScope->apply($q, $filters->period, 'created_at'))
            ->orWhereHas('activityLogs', fn ($q) => $this->dateScope->apply($q, $filters->period, 'created_at'))
            ->distinct()
            ->count('id');
    }

    public function countInactiveStudents(ReportFilters $filters): int
    {
        $totalLinked = $this->countLinkedStudents();
        $active = $this->countActiveStudents($filters);

        return max(0, $totalLinked - $active);
    }

    public function countBaselineLinkedStudents(?ComparisonPeriod $comparisonPeriod): ?int
    {
        if ($comparisonPeriod === null) {
            return null;
        }

        return Student::query()
            ->whereHas('enrollments', fn ($q) => $q->whereBetween('created_at', [
                $comparisonPeriod->startAt,
                $comparisonPeriod->endAt,
            ]))
            ->count();
    }

    public function countBaselineActiveStudents(?ComparisonPeriod $comparisonPeriod): ?int
    {
        if ($comparisonPeriod === null) {
            return null;
        }

        return Student::query()
            ->whereHas('attendances', fn ($q) => $q->whereBetween('created_at', [
                $comparisonPeriod->startAt,
                $comparisonPeriod->endAt,
            ]))
            ->orWhereHas('activityLogs', fn ($q) => $q->whereBetween('created_at', [
                $comparisonPeriod->startAt,
                $comparisonPeriod->endAt,
            ]))
            ->distinct()
            ->count('id');
    }
}
