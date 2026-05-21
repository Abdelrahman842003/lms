<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Reporting\Application\Builders\BreakdownBuilder;
use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademySessionQueries;

final readonly class SessionExecutionBuilder
{
    public function __construct(
        private BreakdownBuilder $breakdownBuilder,
        private AcademySessionQueries $sessionQueries,
    ) {}

    public function build(
        Academy $academy,
        AcademyReportFilters $filters,
        int $page = 1,
        int $perPage = 15,
    ): array {
        $period = $filters->period();

        $summary = [
            'scheduled' => $this->sessionQueries->getScheduledCount($academy, $period, $filters),
            'delivered' => $this->sessionQueries->getDeliveredCount($academy, $period, $filters),
            'canceled' => $this->sessionQueries->getCanceledCount($academy, $period, $filters),
            'postponed' => $this->sessionQueries->getPostponedCount($academy, $period, $filters),
            'avg_attendance' => $this->sessionQueries->getAverageAttendance($academy, $period, $filters),
        ];

        $sessions = $this->sessionQueries->getSessionExecutionList($academy, $period, $filters);

        $schema = [
            'title' => 'string',
            'teacher' => 'string',
            'date' => 'datetime',
            'status' => 'string',
            'attendance_count' => 'int',
            'total_students' => 'int',
        ];

        $sessionsBreakdown = $this->breakdownBuilder->build(
            $sessions,
            $schema,
            ['column' => 'date', 'direction' => 'desc'],
            $page,
            $perPage,
        );

        return [
            'summary' => $summary,
            'sessions' => $sessionsBreakdown,
        ];
    }
}
