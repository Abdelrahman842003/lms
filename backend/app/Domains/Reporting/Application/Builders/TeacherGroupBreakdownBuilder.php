<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\ValueObjects\TeacherReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\TeacherScope;
use App\Domains\Reporting\Infrastructure\Queries\TeacherGroupQueryService;

final readonly class TeacherGroupBreakdownBuilder
{
    public function __construct(
        private TeacherGroupQueryService $groupQuery,
    ) {}

    public function build($teacher, TeacherScope $scope, TeacherReportFilters $filters): array
    {
        $groups = $this->groupQuery->perGroupMetrics($teacher, $filters);

        return [
            'groups' => $groups,
        ];
    }
}
