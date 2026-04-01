<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademyAttendanceQueries;

final readonly class AttendanceQualityBuilder
{
    public function __construct(
        private AcademyAttendanceQueries $attendanceQueries,
    ) {}

    public function build(Academy $academy, AcademyReportFilters $filters): array
    {
        $period = $filters->period();

        return [
            'overall_rate' => $this->attendanceQueries->getOverallAttendanceRate($academy, $period),
            'by_teacher' => $this->attendanceQueries->getAttendanceByTeacher($academy, $period),
            'by_group' => $this->attendanceQueries->getAttendanceByGroup($academy, $period),
            'trend' => $this->attendanceQueries->getAttendanceTrend($academy, $period),
            'best_groups' => $this->attendanceQueries->getBestGroups($academy, $period),
            'weakest_groups' => $this->attendanceQueries->getWeakestGroups($academy, $period),
        ];
    }
}
