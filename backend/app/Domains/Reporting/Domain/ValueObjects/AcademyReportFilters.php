<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\ValueObjects;

use App\Domains\Reporting\Domain\Enums\ComparisonMode;

final readonly class AcademyReportFilters
{
    public function __construct(
        public ReportFilters $base,
        public ?string $teacherId = null,
        public ?string $gradeId = null,
        public ?string $groupId = null,
        public ?string $studentStatus = null,
        public ?string $sessionStatus = null,
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

    public function comparisonMode(): ?ComparisonMode
    {
        return $this->base->comparisonMode;
    }

    public function toArray(): array
    {
        return array_merge($this->base->toArray(), [
            'teacher_id' => $this->teacherId,
            'grade_id' => $this->gradeId,
            'group_id' => $this->groupId,
            'student_status' => $this->studentStatus,
            'session_status' => $this->sessionStatus,
        ]);
    }
}
