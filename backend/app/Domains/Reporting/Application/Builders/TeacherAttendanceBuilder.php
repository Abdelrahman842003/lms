<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\Enums\Direction;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\TeacherScope;
use App\Domains\Reporting\Infrastructure\Queries\TeacherAttendanceQueryService;

final readonly class TeacherAttendanceBuilder
{
    public function __construct(
        private TeacherAttendanceQueryService $attendanceQuery,
    ) {}

    public function build(Teacher $teacher, TeacherScope $scope, ReportFilters $filters): array
    {
        $overallRate = $this->attendanceQuery->overallAttendanceRate($teacher, $filters);
        $byGroup = $this->attendanceQuery->attendanceByGroup($teacher, $filters);
        $bestWorst = $this->attendanceQuery->bestAndWorstGroup($teacher, $filters);
        $change = $this->attendanceQuery->attendanceChangeFromPrevious($teacher, $filters);

        $overallDirection = Direction::Stable->value;
        if ($change !== null) {
            $overallDirection = abs($change) <= 0.5
                ? Direction::Stable->value
                : ($change > 0 ? Direction::Up->value : Direction::Down->value);
        }

        return [
            'overall_rate' => $overallRate,
            'overall_direction' => $overallDirection,
            'by_group' => $byGroup,
            'best_group' => $bestWorst['best'] ?? '',
            'worst_group' => $bestWorst['worst'] ?? '',
            'change_from_previous' => $change,
        ];
    }
}
