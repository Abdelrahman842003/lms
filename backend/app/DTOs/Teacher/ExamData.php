<?php

declare(strict_types=1);

namespace App\DTOs\Teacher;

use Illuminate\Http\Request;

class ExamData
{
    public function __construct(
        public readonly string $title,
        public readonly string $subject,
        public readonly string $grade_id,
        public readonly string $date,
        public readonly int $duration,
        public readonly int $total_marks,
        public readonly int $actual_question_count,
        public readonly array $questions,
        public readonly ?string $group_id = null,
        public readonly int $time_per_question = 60,
        public readonly ?string $academy_id = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            title: $request->validated('title'),
            subject: $request->validated('subject'),
            grade_id: $request->validated('grade_id'),
            date: $request->validated('date'),
            duration: (int) $request->validated('duration'),
            total_marks: (int) $request->validated('total_marks'),
            actual_question_count: (int) $request->validated('actual_question_count'),
            questions: $request->validated('questions'),
            group_id: $request->validated('group_id'),
            time_per_question: (int) ($request->validated('time_per_question') ?? 60),
            academy_id: $request->input('academy_id_override'), // Special input for manual override or context
        );
    }

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'subject' => $this->subject,
            'grade_id' => $this->grade_id,
            'group_id' => $this->group_id,
            'date' => $this->date,
            'duration' => $this->duration,
            'total_marks' => $this->total_marks,
            'actual_question_count' => $this->actual_question_count,
            'questions' => $this->questions,
            'time_per_question' => $this->time_per_question,
        ];
    }
}
