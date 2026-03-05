<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\DTOs;

use Illuminate\Http\Request;

class TeacherGroupData
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $grade_id = null,
        public readonly ?string $description = null,
        public readonly ?string $academy_id = null,
        public readonly ?string $time = null,
        public readonly ?string $days = null,
        public readonly ?string $type = null,
        public readonly ?float $price = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            grade_id: $request->validated('grade_id'),
            description: $request->validated('description'),
            academy_id: $request->validated('academy_id'),
            time: $request->validated('time'),
            days: $request->validated('days'),
            type: self::normalizeType($request->validated('type')),
            price: $request->validated('price') ? (float) $request->validated('price') : null,
        );
    }

    private static function normalizeType(?string $type): ?string
    {
        return match ($type) {
            'general' => 'public',
            default => $type,
        };
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'grade_id' => $this->grade_id,
            'description' => $this->description,
            'academy_id' => $this->academy_id,
            'time' => $this->time,
            'days' => $this->days,
            'type' => $this->type,
            'price' => $this->price,
        ], fn($value) => !is_null($value));
    }
}
