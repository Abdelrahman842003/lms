<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class TeacherScope
{
    public function __construct(
        public string $teacherId,
        public ?string $academyId = null,
        public ?string $groupId = null,
    ) {
        if (empty($teacherId)) {
            throw new InvalidArgumentException('Teacher ID is required');
        }
    }

    public function isIndependent(): bool
    {
        return $this->academyId === null;
    }

    public function hasGroupFilter(): bool
    {
        return $this->groupId !== null;
    }

    public static function fromRequest(string $teacherId, ?string $academyId = null, ?string $groupId = null): self
    {
        return new self(
            teacherId: $teacherId,
            academyId: $academyId,
            groupId: $groupId,
        );
    }
}
