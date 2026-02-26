<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\DTOs;

use App\Domains\Enrollments\Enums\EnrollmentStatus;
use App\Domains\Subscriptions\Enums\PeriodType;
use Carbon\CarbonImmutable;

final readonly class CreateEnrollmentDTO
{
    public function __construct(
        public int             $studentId,
        public int             $teacherId,
        public ?int            $groupId       = null,
        public ?int            $organizationId = null,
        public ?int            $gradeId       = null,
        public PeriodType      $periodType    = PeriodType::MONTHLY,
        public ?CarbonImmutable $startsAt     = null,
        public ?CarbonImmutable $endsAt       = null,
        public EnrollmentStatus $status       = EnrollmentStatus::ACTIVE,
    ) {}

    public function toArray(): array
    {
        return [
            'student_id'      => $this->studentId,
            'teacher_id'      => $this->teacherId,
            'group_id'        => $this->groupId,
            'academy_id'      => $this->organizationId,
            'grade_id'        => $this->gradeId,
            'is_active'       => $this->status === EnrollmentStatus::ACTIVE,
            'subscription_start' => $this->startsAt?->toDateString(),
            'subscription_end'   => $this->endsAt?->toDateString(),
        ];
    }

    public static function fromRequest(array $validated): self
    {
        return new self(
            studentId:      (int) $validated['student_id'],
            teacherId:      (int) $validated['teacher_id'],
            groupId:        isset($validated['group_id']) ? (int) $validated['group_id'] : null,
            organizationId: isset($validated['academy_id']) ? (int) $validated['academy_id'] : null,
            gradeId:        isset($validated['grade_id']) ? (int) $validated['grade_id'] : null,
            periodType:     PeriodType::tryFrom($validated['period_type'] ?? 'monthly') ?? PeriodType::MONTHLY,
            startsAt:       isset($validated['starts_at']) ? CarbonImmutable::parse($validated['starts_at']) : null,
            endsAt:         isset($validated['ends_at']) ? CarbonImmutable::parse($validated['ends_at']) : null,
        );
    }
}
