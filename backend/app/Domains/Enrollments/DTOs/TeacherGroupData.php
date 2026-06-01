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
            academy_id: $request->input('academy_id'),
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
        $data = [
            'name' => $this->name,
            'academy_id' => $this->academy_id,
        ];

        // Only include optional fields if they are not null
        if (!is_null($this->grade_id)) $data['grade_id'] = $this->grade_id;
        if (!is_null($this->description)) $data['description'] = $this->description;
        if (!is_null($this->time)) $data['time'] = $this->time;
        if (!is_null($this->days)) $data['days'] = $this->days;
        if (!is_null($this->type)) $data['type'] = $this->type;
        if (!is_null($this->price)) $data['price'] = $this->price;

        return $data;
    }
}
