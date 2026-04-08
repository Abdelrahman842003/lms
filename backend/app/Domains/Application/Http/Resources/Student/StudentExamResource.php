<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Student;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentExamResource extends JsonResource
{
    /**
     * Transform resource into an array.
     */
    public function toArray($request): array
    {
        $studentResult = $this->whenLoaded('results', function () {
            return $this->results->first();
        });

        $score = $studentResult?->score !== null ? (float) $studentResult->score : null;
        $percentage = $studentResult?->percentage !== null ? (float) $studentResult->percentage : null;

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
            'is_completed' => $studentResult !== null,
            'student_score' => $score,
            'student_percentage' => $percentage,
            // Backward compatibility with older frontend stats card logic
            'score' => $percentage,
        ];
    }
}
