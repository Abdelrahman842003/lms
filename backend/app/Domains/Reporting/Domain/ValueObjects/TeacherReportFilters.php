<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\ValueObjects;

final readonly class TeacherReportFilters
{
    public function __construct(
        public ReportFilters $base,
        public ?string $groupId = null,
        public ?string $studentActivityState = null,
        public ?string $attendanceState = null,
    ) {}

    public function period(): ReportingPeriod
    {
        return $this->base->period;
    }

    public function hasComparison(): bool
    {
        return $this->base->hasComparison();
    }

    public function comparisonPeriod(): ?ComparisonPeriod
    {
        return $this->base->comparisonPeriod;
    }

    public function toArray(): array
    {
        return array_merge($this->base->toArray(), [
            'group_id' => $this->groupId,
            'student_activity_state' => $this->studentActivityState,
            'attendance_state' => $this->attendanceState,
        ]);
    }
}
