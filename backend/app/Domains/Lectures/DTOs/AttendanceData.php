<?php

declare(strict_types=1);

namespace App\Domains\Lectures\DTOs;

use Illuminate\Http\Request;

readonly class AttendanceData
{
    public function __construct(
        public string $teacher_id,
        public string $date,
        public ?string $notes,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            teacher_id: $request->validated('teacher_id'),
            date: $request->validated('date'),
            notes: $request->validated('notes'),
        );
    }

    public function toArray(): array
    {
        return [
            'teacher_id' => $this->teacher_id,
            'date' => $this->date,
            'notes' => $this->notes,
        ];
    }
}
