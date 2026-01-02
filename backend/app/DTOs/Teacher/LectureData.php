<?php

declare(strict_types=1);

namespace App\DTOs\Teacher;

use App\Http\Requests\Teacher\Lecture\StoreLectureRequest;
use Carbon\Carbon;

/**
 * Data Transfer Object for Lecture creation/update operations.
 * Acts as a contract between the Controller and Service layers.
 */
final readonly class LectureData
{
    public function __construct(
        public string $title,
        public ?string $description,
        public string $gradeId,
        public ?string $groupId,
        public ?Carbon $date,
        public bool $isRecurring,
        public ?array $recurrenceDays,
        public ?string $recurrenceTime,
        public ?int $durationMinutes,
    ) {}

    /**
     * Create a LectureData instance from a validated request.
     */
    public static function fromRequest(StoreLectureRequest $request): self
    {
        $validated = $request->validated();
        
        return new self(
            title: $validated['title'],
            description: $validated['description'] ?? null,
            gradeId: $validated['grade_id'],
            groupId: $validated['group_id'] ?? null,
            date: isset($validated['date']) ? Carbon::parse($validated['date']) : null,
            isRecurring: $request->boolean('is_recurring'),
            recurrenceDays: $validated['recurrence_days'] ?? null,
            recurrenceTime: $validated['recurrence_time'] ?? null,
            durationMinutes: $validated['duration_minutes'] ?? null,
        );
    }

    /**
     * Convert to array for model creation.
     */
    public function toArray(): array
    {
        if ($this->isRecurring) {
            return [
                'title' => $this->title,
                'description' => $this->description,
                'grade_id' => $this->gradeId,
                'group_id' => $this->groupId,
                'is_active' => false,
                'is_recurring' => true,
                'recurrence_days' => $this->recurrenceDays,
                'recurrence_time' => $this->recurrenceTime,
                'duration_minutes' => $this->durationMinutes,
            ];
        }

        return [
            'title' => $this->title,
            'description' => $this->description,
            'grade_id' => $this->gradeId,
            'group_id' => $this->groupId,
            'start_time' => $this->date?->copy()->startOfDay(),
            'end_time' => $this->date?->copy()->addHours(24),
            'is_active' => false,
        ];
    }
}
