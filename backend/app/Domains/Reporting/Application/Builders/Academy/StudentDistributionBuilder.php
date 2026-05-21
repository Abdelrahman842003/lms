<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademyStudentQueries;

final readonly class StudentDistributionBuilder
{
    public function __construct(
        private AcademyStudentQueries $studentQueries,
    ) {}

    public function build(Academy $academy, AcademyReportFilters $filters): array
    {
        $period = $filters->period();

        return [
            'by_grade' => $this->studentQueries->getStudentsByGrade($academy, $filters),
            'by_group' => $this->studentQueries->getStudentsByGroup($academy, $filters),
            'by_teacher' => $this->studentQueries->getStudentsByTeacher($academy, $filters),
            'active_vs_inactive' => $this->studentQueries->getActiveVsInactive($academy, $filters),
            'new_students_over_time' => $this->studentQueries->getNewStudentsOverTime($academy, $period, $filters),
        ];
    }
}
