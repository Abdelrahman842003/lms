<?php

declare(strict_types=1);

namespace App\DTOs\Academy;

use Illuminate\Http\Request;

readonly class GroupData
{
    public function __construct(
        public string $name,
        public string $type,
        public ?string $teacherId = null,
        public ?string $gradeId = null,
        public ?string $time = null,
        public ?string $days = null,
        public ?float $price = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            type: $request->validated('type'),
            teacherId: $request->validated('teacher_id'),
            gradeId: $request->validated('grade_id'),
            time: $request->validated('time'),
            days: $request->validated('days'),
            price: $request->validated('price') !== null ? (float) $request->validated('price') : null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'type' => $this->type,
            'teacher_id' => $this->teacherId,
            'grade_id' => $this->gradeId,
            'time' => $this->time,
            'days' => $this->days,
            'price' => $this->price,
        ], fn($value) => $value !== null);
    }
}
