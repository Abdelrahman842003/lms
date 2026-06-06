<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Reporting\Domain\ValueObjects\TeacherReportFilters;
use Carbon\CarbonImmutable;

final class TeacherStudentQueryService
{
    public function totalLinkedStudents($teacher, TeacherReportFilters $filters): int
    {
        $query = $teacher->enrollments()
            ->where('enrollments.created_at', '<=', $filters->base->period->endAt);

        $query = $this->applyFilters($query, $filters);

        return $query->count();
    }

    public function activeStudentsCount($teacher, TeacherReportFilters $filters): int
    {
        $query = $teacher->enrollments()
            ->where('is_active', true)
            ->where('enrollments.created_at', '<=', $filters->base->period->endAt);

        $query = $this->applyFilters($query, $filters);

        return $query->count();
    }

    public function inactiveStudentsCount($teacher, TeacherReportFilters $filters): int
    {
        $query = $teacher->enrollments()
            ->where('is_active', false)
            ->where('enrollments.created_at', '<=', $filters->base->period->endAt);

        $query = $this->applyFilters($query, $filters);

        return $query->count();
    }

    public function newStudentsInPeriod($teacher, TeacherReportFilters $filters): int
    {
        $query = $teacher->enrollments()
            ->whereBetween('enrollments.created_at', [$filters->base->period->startAt, $filters->base->period->endAt]);

        $query = $this->applyFilters($query, $filters);

        return $query->count();
    }

    public function monthlyStudentActivityTrend($teacher, TeacherReportFilters $filters, int $months = 12): array
    {
        $series = [];
        $current = CarbonImmutable::now()->subMonthsNoOverflow($months - 1)->startOfMonth();

        for ($i = 0; $i < $months; $i++) {
            $monthStart = $current->addMonthsNoOverflow($i);
            $monthEnd = $monthStart->endOfMonth();

            $query = $teacher->enrollments()
                ->where('is_active', true)
                ->where('enrollments.created_at', '<=', $monthEnd);
            
            $query = $this->applyFilters($query, $filters);

            $count = $query->count();

            $series[] = [
                'label' => $monthStart->format('M Y'),
                'value' => $count,
            ];
        }

        return $series;
    }

    private function applyFilters($query, TeacherReportFilters $filters)
    {
        return $query
            ->when($filters->groupId, fn ($q) => $q->where('group_id', $filters->groupId))
            ->when($filters->studentActivityState === 'active', fn ($q) => $q->where('is_active', true))
            ->when($filters->studentActivityState === 'inactive', fn ($q) => $q->where('is_active', false));
    }
}
