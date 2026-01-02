<?php

declare(strict_types=1);

namespace App\DTOs\Teacher;

use App\Http\Requests\Teacher\Exam\StoreExamRequest;
use Carbon\Carbon;

/**
 * Data Transfer Object for Exam creation/update operations.
 */
final readonly class ExamData
{
    public function __construct(
        public string $title,
        public ?string $subject,
        public string $gradeId,
        public ?string $groupId,
        public Carbon $date,
        public int $duration,
        public int $maxScore,
        public array $questions,
    ) {}

    /**
     * Create an ExamData instance from a validated request.
     */
    public static function fromRequest(StoreExamRequest $request): self
    {
        $validated = $request->validated();
        
        return new self(
            title: $validated['title'],
            subject: $validated['subject'] ?? null,
            gradeId: $validated['grade_id'],
            groupId: $validated['group_id'] ?? null,
            date: Carbon::parse($validated['date']),
            duration: (int) $validated['duration'],
            maxScore: (int) ($validated['max_score'] ?? 100),
            questions: $validated['questions'] ?? [],
        );
    }

    /**
     * Convert to array for model creation.
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'subject' => $this->subject,
            'grade_id' => $this->gradeId,
            'group_id' => $this->groupId,
            'date' => $this->date,
            'duration' => $this->duration,
            'max_score' => $this->maxScore,
            'is_active' => false,
        ];
    }

    /**
     * Get questions array for separate creation.
     */
    public function getQuestions(): array
    {
        return $this->questions;
    }
}
