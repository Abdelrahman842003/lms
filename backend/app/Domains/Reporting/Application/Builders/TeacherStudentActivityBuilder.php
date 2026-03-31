<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\TeacherScope;
use App\Domains\Reporting\Infrastructure\Queries\TeacherStudentQueryService;

final readonly class TeacherStudentActivityBuilder
{
    public function __construct(
        private TeacherStudentQueryService $studentQuery,
    ) {}

    public function build(Teacher $teacher, TeacherScope $scope, ReportFilters $filters): array
    {
        $total = $this->studentQuery->totalLinkedStudents($teacher, $filters);
        $active = $this->studentQuery->activeStudentsCount($teacher, $filters);
        $inactive = $this->studentQuery->inactiveStudentsCount($teacher, $filters);
        $newStudents = $this->studentQuery->newStudentsInPeriod($teacher, $filters);
        $activityTrend = $this->studentQuery->monthlyStudentActivityTrend($teacher, $filters);

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
