<?php

declare(strict_types=1);

namespace App\Http\Resources\Student;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentExamResource extends JsonResource
{
    /**
     * Transform resource into an array.
     */
    public function toArray($request): array
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
