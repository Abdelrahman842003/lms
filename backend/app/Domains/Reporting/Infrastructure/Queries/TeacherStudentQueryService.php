<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use Carbon\CarbonImmutable;

final class TeacherStudentQueryService
{
    public function totalLinkedStudents(Teacher $teacher, ReportFilters $filters): int
    {
        return Enrollment::where('teacher_id', $teacher->id)
            ->where('created_at', '<=', $filters->period->endAt)
            ->count();
    }

    public function activeStudentsCount(Teacher $teacher, ReportFilters $filters): int
    {
        return Enrollment::where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->where('created_at', '<=', $filters->period->endAt)
            ->count();
    }

    public function inactiveStudentsCount(Teacher $teacher, ReportFilters $filters): int
    {
        return $this->totalLinkedStudents($teacher, $filters)
            - $this->activeStudentsCount($teacher, $filters);
    }

    public function newStudentsInPeriod(Teacher $teacher, ReportFilters $filters): int
    {
        return Enrollment::where('teacher_id', $teacher->id)
            ->whereBetween('created_at', [$filters->period->startAt, $filters->period->endAt])
            ->count();
    }

    public function monthlyStudentActivityTrend(Teacher $teacher, ReportFilters $filters, int $months = 12): array
    {
        $series = [];
        $current = CarbonImmutable::now()->subMonthsNoOverflow($months - 1)->startOfMonth();

        for ($i = 0; $i < $months; $i++) {
            $monthStart = $current->addMonthsNoOverflow($i);
            $monthEnd = $monthStart->endOfMonth();

            $count = Enrollment::where('teacher_id', $teacher->id)
                ->where('is_active', true)
                ->where('created_at', '<=', $monthEnd)
                ->count();

            $series[] = [
                'label' => $monthStart->format('M Y'),
                'value' => $count,
            ];
        }

        return $series;
    }
}
