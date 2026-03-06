<?php

declare(strict_types=1);

namespace App\Domains\Videos\DTOs;

final readonly class UpdateVideoData
{
    /**
     * @param array<string, mixed> $attributes
     * @param array<int, string>|null $groupIds
     */
    public function __construct(
        public array $attributes,
        public ?array $groupIds,
    ) {}

    /**
     * @param array<string, mixed> $validated
     */
    public static function fromArray(array $validated): self
    {
        $attributes = [];

        foreach ([
            'title',
            'description',
            'grade_id',
            'lecture_id',
            'lesson_id',
            'scheduled_at',
            'available_from',
            'available_until',
            'teacher_reference_id',
            'teacher_reference_name',
        ] as $key) {
            if (array_key_exists($key, $validated)) {
                $attributes[$key] = $validated[$key];
            }
        }

        return new self(
            attributes: $attributes,
            groupIds: array_key_exists('group_ids', $validated)
                ? array_values(array_map('strval', (array) $validated['group_ids']))
                : null,
        );
    }
}
