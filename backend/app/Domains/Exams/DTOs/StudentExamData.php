<?php

declare(strict_types=1);

namespace App\Domains\Exams\DTOs;

readonly class StudentExamData
{
    public function __construct(
        public string $id,
        public string $title,
        public string $subject,
        public int $duration,
        public int $max_score,
        public ?int $actual_question_count,
        public ?int $time_per_question,
        public string $date,
        public bool $is_active,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            title: $data['title'],
            subject: $data['subject'],
            duration: $data['duration'],
            max_score: $data['max_score'],
            actual_question_count: $data['actual_question_count'] ?? null,
            time_per_question: $data['time_per_question'] ?? null,
            date: $data['date'],
            is_active: $data['is_active'],
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'subject' => $this->subject,
            'duration' => $this->duration,
            'max_score' => $this->max_score,
            'actual_question_count' => $this->actual_question_count,
            'time_per_question' => $this->time_per_question,
            'date' => $this->date,
            'is_active' => $this->is_active,
        ];
    }
}
