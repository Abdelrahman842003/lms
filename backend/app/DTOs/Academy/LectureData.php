<?php

declare(strict_types=1);

namespace App\DTOs\Academy;

use Illuminate\Http\Request;

readonly class LectureData
{
    public function __construct(
        public string $teacherId,
        public string $title,
        public string $gradeId,
        public string $recurrenceTime,
        public int $durationMinutes,
        public ?string $description = null,
        public ?string $groupId = null,
        public ?string $date = null,
        public bool $isRecurring = false,
        public array $recurrenceDays = [],
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            teacherId: $request->validated('teacher_id'),
            title: $request->validated('title'),
            gradeId: $request->validated('grade_id'),
            recurrenceTime: $request->validated('recurrence_time'),
            durationMinutes: (int) $request->validated('duration_minutes'),
            description: $request->validated('description'),
            groupId: $request->validated('group_id'),
            date: $request->validated('date'),
            isRecurring: (bool) $request->validated('is_recurring', false),
            recurrenceDays: $request->validated('recurrence_days', []),
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'teacher_id' => $this->teacherId,
            'title' => $this->title,
            'description' => $this->description,
            'grade_id' => $this->gradeId,
            'group_id' => $this->groupId,
            'date' => $this->date,
            'is_recurring' => $this->isRecurring,
            'recurrence_days' => $this->recurrenceDays,
            'recurrence_time' => $this->recurrenceTime,
            'duration_minutes' => $this->durationMinutes,
        ], fn($value) => $value !== null);
    }
}
