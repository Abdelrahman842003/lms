<?php

declare(strict_types=1);

namespace App\DTOs\Teacher;

use Illuminate\Http\Request;

class GradeData
{
    public function __construct(
        public readonly string $name,
        public readonly float $price,
        public readonly ?string $description = null,
        public readonly ?string $academy_id = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            price: (float) $request->validated('price'),
            description: $request->validated('description'),
            academy_id: $request->validated('academy_id'),
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'price' => $this->price,
            'description' => $this->description,
            'academy_id' => $this->academy_id,
        ], fn($value) => !is_null($value));
    }
}
