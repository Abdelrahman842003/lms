<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\Enums\ReportingPeriodPreset;
use App\Domains\Reporting\Domain\ValueObjects\TeacherReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\TeacherScope;
use App\Domains\Reporting\Infrastructure\Queries\TeacherStudentQueryService;
use Carbon\CarbonImmutable;

final readonly class TeacherStudentActivityBuilder
{
    public function __construct(
        private TeacherStudentQueryService $studentQuery,
    ) {}

    public function build(Teacher $teacher, TeacherScope $scope, TeacherReportFilters $filters): array
    {
        $period = $filters->base->period;
        $months = 12; // Default fallback

        if ($period->preset) {
            $months = match ($period->preset) {
                ReportingPeriodPreset::Today,
                ReportingPeriodPreset::Last7Days,
                ReportingPeriodPreset::ThisMonth,
                ReportingPeriodPreset::LastMonth => 1,
                ReportingPeriodPreset::Last3Months => 3,
                ReportingPeriodPreset::ThisYear => (int) CarbonImmutable::now($period->timezone)->month,
                ReportingPeriodPreset::CustomRange => (int) $period->startAt->diffInMonths($period->endAt) + 1,
            };
        } else {
            $months = (int) $period->startAt->diffInMonths($period->endAt) + 1;
        }

        $months = max(1, min($months, 36));

        $total = $this->studentQuery->totalLinkedStudents($teacher, $filters);
        $active = $this->studentQuery->activeStudentsCount($teacher, $filters);
        $inactive = $this->studentQuery->inactiveStudentsCount($teacher, $filters);
        $newStudents = $this->studentQuery->newStudentsInPeriod($teacher, $filters);
        $activityTrend = $this->studentQuery->monthlyStudentActivityTrend($teacher, $filters, $months);

        return [
            'metrics' => [
                'total_students' => $total,
                'active_students' => $active,
                'inactive_students' => $inactive,
                'new_students' => $newStudents,
                'activity_trend' => $activityTrend,
            ],
            'students' => [],
        ];
    }
}
