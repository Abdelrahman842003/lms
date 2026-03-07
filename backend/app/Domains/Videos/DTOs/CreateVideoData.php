<?php

declare(strict_types=1);

namespace App\Domains\Videos\DTOs;

use Illuminate\Http\UploadedFile;

final readonly class CreateVideoData
{
    /**
     * @param array<int, string>       $groupIds
     * @param array<int, UploadedFile> $attachments
     */
    public function __construct(
        public string $title,
        public ?string $description,
        public string $gradeId,
        public array $groupIds,
        public ?string $lectureId,
        public ?string $lessonId,
        public ?\DateTimeInterface $scheduledAt,
        public ?\DateTimeInterface $availableFrom,
        public ?\DateTimeInterface $availableUntil,
        public ?UploadedFile $videoFile,  // nullable — not needed in direct-upload flow
        public array $attachments,
        public ?string $teacherReferenceId,
        public ?string $teacherReferenceName,
    ) {}

    /**
     * Legacy / attachment-only flow.
     *
     * @param array<string, mixed> $validated
     */
    public static function fromArray(array $validated): self
    {
        return new self(
            title: (string) $validated['title'],
            description: isset($validated['description']) ? (string) $validated['description'] : null,
            gradeId: (string) $validated['grade_id'],
            groupIds: array_values(array_map('strval', (array) ($validated['group_ids'] ?? []))),
            lectureId: isset($validated['lecture_id']) ? (string) $validated['lecture_id'] : null,
            lessonId: isset($validated['lesson_id']) ? (string) $validated['lesson_id'] : null,
            scheduledAt: isset($validated['scheduled_at']) ? now()->parse($validated['scheduled_at']) : null,
            availableFrom: isset($validated['available_from']) ? now()->parse($validated['available_from']) : null,
            availableUntil: isset($validated['available_until']) ? now()->parse($validated['available_until']) : null,
            videoFile: $validated['video_file'] ?? null,
            attachments: (array) ($validated['attachments'] ?? []),
            teacherReferenceId: isset($validated['teacher_reference_id']) ? (string) $validated['teacher_reference_id'] : null,
            teacherReferenceName: isset($validated['teacher_reference_name']) ? (string) $validated['teacher_reference_name'] : null,
        );
    }

    /**
     * New direct-upload flow — built from the initiate-upload request (no file bytes).
     *
     * @param array<string, mixed> $validated
     */
    public static function fromInitiateRequest(array $validated): self
    {
        return new self(
            title: (string) $validated['title'],
            description: isset($validated['description']) ? (string) $validated['description'] : null,
            gradeId: (string) $validated['grade_id'],
            groupIds: array_values(array_map('strval', (array) ($validated['group_ids'] ?? []))),
            lectureId: isset($validated['lecture_id']) ? (string) $validated['lecture_id'] : null,
            lessonId: isset($validated['lesson_id']) ? (string) $validated['lesson_id'] : null,
            scheduledAt: isset($validated['scheduled_at']) ? now()->parse($validated['scheduled_at']) : null,
            availableFrom: isset($validated['available_from']) ? now()->parse($validated['available_from']) : null,
            availableUntil: isset($validated['available_until']) ? now()->parse($validated['available_until']) : null,
            videoFile: null,
            attachments: [],
            teacherReferenceId: isset($validated['teacher_reference_id']) ? (string) $validated['teacher_reference_id'] : null,
            teacherReferenceName: isset($validated['teacher_reference_name']) ? (string) $validated['teacher_reference_name'] : null,
        );
    }
}
