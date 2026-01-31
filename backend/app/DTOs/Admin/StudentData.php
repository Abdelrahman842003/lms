<?php

declare(strict_types=1);

namespace App\DTOs\Admin;

use Illuminate\Http\Request;

readonly class StudentData
{
    public function __construct(
        public string $name,
        public string $phone,
        public string $password,
        public ?string $teacher_id = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            phone: $request->validated('phone'),
            password: $request->validated('password'),
            teacher_id: $request->validated('teacher_id'),
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'phone' => $this->phone,
            'password' => bcrypt($this->password),
            'teacher_id' => $this->teacher_id,
        ], fn($value) => !is_null($value));
    }
}
