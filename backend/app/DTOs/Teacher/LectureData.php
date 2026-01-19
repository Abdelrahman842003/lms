<?php

declare(strict_types=1);

namespace App\DTOs\Teacher;

use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Data Transfer Object for Lecture creation/update operations.
 * Acts as a contract between the Controller and Service layers.
 */
final readonly class LectureData
{
    public function __construct(
        public ?string $title,
        public ?string $description,
        public ?string $gradeId,
        public ?string $groupId,
        public ?Carbon $date,
        public ?bool $isRecurring,
        public ?array $recurrenceDays,
        public ?string $recurrenceTime,
        public ?int $durationMinutes,
    ) {}

    /**
     * Create a LectureData instance from a validated request.
     */
    public static function fromRequest(Request $request): self
    {
        // Use validated data if available (FormRequest), otherwise all input
        $validated = method_exists($request, 'validated') ? $request->validated() : $request->all();
        
        return new self(
            title: $validated['title'] ?? null,
            description: $validated['description'] ?? null,
            gradeId: $validated['grade_id'] ?? null,
            groupId: $validated['group_id'] ?? null,
            date: isset($validated['date']) && $validated['date'] ? Carbon::parse($validated['date']) : null,
            isRecurring: isset($validated['is_recurring']) ? (bool) $validated['is_recurring'] : null,
            recurrenceDays: $validated['recurrence_days'] ?? null,
            recurrenceTime: $validated['recurrence_time'] ?? null,
            durationMinutes: isset($validated['duration_minutes']) ? (int) $validated['duration_minutes'] : null,
        );
    }

    /**
     * Convert to array for model creation/update.
     */
    public function toArray(): array
    {
        $data = array_filter([
            'title' => $this->title,
            'description' => $this->description,
            'grade_id' => $this->gradeId,
            'group_id' => $this->groupId,
            'is_recurring' => $this->isRecurring,
            'recurrence_days' => $this->recurrenceDays,
            'recurrence_time' => $this->recurrenceTime,
            'duration_minutes' => $this->durationMinutes,
        ], fn($value) => !is_null($value));

        // Handle date/time logic if date is provided
        if ($this->date) {
            if ($this->isRecurring) {
                // For recurring, we don't set start_time/end_time based on date directly usually
            } else {
                // Non-recurring logic
                // Default to full day in Cairo, converted to UTC
                $startTime = $this->date->copy()->setTimezone('Africa/Cairo')->startOfDay()->setTimezone('UTC');
                $endTime = $this->date->copy()->setTimezone('Africa/Cairo')->addHours(24)->setTimezone('UTC');

                if ($this->recurrenceTime && $this->durationMinutes) {
                    // Parse the specific time in Cairo timezone
                    $startTime = Carbon::parse($this->date->format('Y-m-d') . ' ' . $this->recurrenceTime, 'Africa/Cairo')
                        ->setTimezone('UTC');
                    $endTime = $startTime->copy()->addMinutes($this->durationMinutes);
                }
                
                $data['start_time'] = $startTime;
                $data['end_time'] = $endTime;
            }
        }
        
        return $data;
    }
}
