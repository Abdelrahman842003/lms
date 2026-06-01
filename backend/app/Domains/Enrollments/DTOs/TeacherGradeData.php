<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\DTOs;

use Illuminate\Http\Request;

class TeacherGradeData
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
            academy_id: $request->input('academy_id'),
        );
    }

    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'price' => $this->price,
            'academy_id' => $this->academy_id,
        ];

        if (!is_null($this->description)) {
            $data['description'] = $this->description;
        }

        return $data;
    }
}
