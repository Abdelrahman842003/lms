<?php

declare(strict_types=1);

namespace App\DTOs\Academy;

use Illuminate\Http\Request;

readonly class GradeData
{
    public function __construct(
        public string $name,
        public float $price,
        public ?string $teacherId = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            price: (float) $request->validated('price'),
            teacherId: $request->validated('teacher_id'),
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'price' => $this->price,
            'teacher_id' => $this->teacherId,
        ];
    }
}
