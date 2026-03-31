<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Reporting\Application\Builders\SummaryBuilder;
use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademyStudentQueries;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademyTeacherQueries;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademyAttendanceQueries;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademySessionQueries;

final readonly class AcademySnapshotBuilder
{
    public function __construct(
        private SummaryBuilder $summaryBuilder,
        private AcademyStudentQueries $studentQueries,
        private AcademyTeacherQueries $teacherQueries,
        private AcademyAttendanceQueries $attendanceQueries,
        private AcademySessionQueries $sessionQueries,
    ) {}

    public function build(Academy $academy, AcademyReportFilters $filters): array
    {
        $period = $filters->period();
        $baselinePeriod = $filters->hasComparison()
            ? $filters->comparisonPeriod()
            : null;

        $totalStudents = $this->studentQueries->getTotalStudents($academy);
        $activeStudents = $this->studentQueries->getActiveStudents($academy);
        $newStudents = $this->studentQueries->getNewStudents($academy, $period);
        $inactiveStudents = $totalStudents - $activeStudents;
        $totalTeachers = $this->teacherQueries->getActiveTeachers($academy);

        $activeGroups = $academy->groups()->count();

        $sessionsDelivered = $this->sessionQueries->getDeliveredCount($academy, $period);
        $attendanceRate = $this->attendanceQueries->getOverallAttendanceRate($academy, $period);

        $metricDefinitions = [
            [
                'key' => 'total_students',
                'title' => 'إجمالي الطلاب',
                'current' => $totalStudents,
                'drilldown_key' => 'students_list',
            ],
            [
                'key' => 'active_students',
                'title' => 'الطلاب النشطين',
                'current' => $activeStudents,
                'drilldown_key' => 'active_students_list',
            ],
            [
                'key' => 'new_students',
                'title' => 'طلاب جدد هذا الشهر',
                'current' => $newStudents,
            ],
            [
                'key' => 'inactive_students',
                'title' => 'الطلاب غير النشطين',
                'current' => $inactiveStudents,
                'status_color' => $inactiveStudents > $activeStudents ? 'warning' : null,
            ],
            [
                'key' => 'total_teachers',
                'title' => 'إجمالي المعلمين',
                'current' => $totalTeachers,
                'drilldown_key' => 'teachers_performance',
            ],
            [
                'key' => 'active_groups',
                'title' => 'المجموعات النشطة',
                'current' => $activeGroups,
            ],
            [
                'key' => 'sessions_delivered',
                'title' => 'الحصص المقدمة',
                'current' => $sessionsDelivered,
                'drilldown_key' => 'session_execution',
            ],
            [
                'key' => 'attendance_rate',
                'title' => 'نسبة الحضور',
                'current' => $attendanceRate,
                'note' => '%',
                'status_color' => $attendanceRate >= 80 ? 'success' : ($attendanceRate >= 60 ? 'warning' : 'danger'),
                'drilldown_key' => 'attendance_breakdown',
            ],
        ];

        $kpis = $this->summaryBuilder->build($metricDefinitions, $filters->base);

        return [
            'kpis' => array_map(fn (object $kpi) => $kpi->toArray(), $kpis),
            'period' => [
                'start' => $period->startAt->toDateTimeString(),
                'end' => $period->endAt->toDateTimeString(),
                'preset' => $period->preset?->value,
            ],
        ];
    }
}
