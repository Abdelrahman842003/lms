<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Reporting\Application\Builders\BreakdownBuilder;
use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademyTeacherQueries;

final readonly class TeacherPerformanceBuilder
{
    public function __construct(
        private BreakdownBuilder $breakdownBuilder,
        private AcademyTeacherQueries $teacherQueries,
    ) {}

    public function build(
        Academy $academy,
        AcademyReportFilters $filters,
        int $page = 1,
        int $perPage = 15,
        string $sortColumn = 'linked_students',
        string $sortDirection = 'desc',
    ): array {
        $period = $filters->period();
        $rows = $this->teacherQueries->getTeacherPerformanceMetrics($academy, $period);

        usort($rows, function ($a, $b) use ($sortColumn) {
            $aVal = $a[$sortColumn] ?? 0;
            $bVal = $b[$sortColumn] ?? 0;

            return $sortDirection === 'desc' ? $bVal <=> $aVal : $aVal <=> $bVal;
        });

        $schema = [
            'teacher_name' => 'string',
            'linked_students' => 'int',
            'active_students' => 'int',
            'attendance_pct' => 'float',
            'groups_count' => 'int',
            'delivered_sessions' => 'int',
            'trend' => 'string',
        ];

        $rows = array_map(function ($row) {
            $row['trend'] = 'stable';
            return $row;
        }, $rows);

        return $this->breakdownBuilder->build(
            $rows,
            $schema,
            ['column' => $sortColumn, 'direction' => $sortDirection],
            $page,
            $perPage,
        );
    }
}
