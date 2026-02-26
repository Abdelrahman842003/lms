<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\DTOs;

use App\Domains\Enrollments\Enums\GroupType;

final readonly class CreateGroupDTO
{
    public function __construct(
        public string    $name,
        public int       $teacherId,
        public int       $gradeId,
        public GroupType $type       = GroupType::PUBLIC,
        public ?int      $organizationId = null,
        public ?float    $price      = null,
        public ?string   $time       = null,
        public ?array    $days       = null,
    ) {}

    public function toArray(): array
    {
        return [
            'name'       => $this->name,
            'teacher_id' => $this->teacherId,
            'grade_id'   => $this->gradeId,
            'academy_id' => $this->organizationId,
            'type'       => $this->type->value,
            'price'      => $this->price,
            'time'       => $this->time,
            'days'       => $this->days,
        ];
    }

    public static function fromRequest(array $validated): self
    {
        return new self(
            name:           $validated['name'],
            teacherId:      (int) $validated['teacher_id'],
            gradeId:        (int) $validated['grade_id'],
            type:           GroupType::tryFrom($validated['type'] ?? 'public') ?? GroupType::PUBLIC,
            organizationId: isset($validated['academy_id']) ? (int) $validated['academy_id'] : null,
            price:          isset($validated['price']) ? (float) $validated['price'] : null,
            time:           $validated['time'] ?? null,
            days:           $validated['days'] ?? null,
        );
    }
}
