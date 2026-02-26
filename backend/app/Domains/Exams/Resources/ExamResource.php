<?php

declare(strict_types=1);

namespace App\Domains\Exams\Resources;

use App\Domains\Enrollments\Resources\GradeResource;
use App\Domains\Enrollments\Resources\GroupResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'subject' => $this->subject,
            'max_score' => $this->max_score,
            'date' => $this->date?->toIso8601String(),
            'duration' => $this->duration,
            'actual_question_count' => $this->actual_question_count,
            'time_per_question' => $this->time_per_question,
            'is_active' => $this->is_active,
            'grade' => new GradeResource($this->whenLoaded('grade')),
            'group' => new GroupResource($this->whenLoaded('group')),
            'questions_count' => (int) ($this->questions_count ?? 0),
            'activated_at' => $this->activated_at?->toIso8601String(),
            'ended_at' => $this->ended_at?->toIso8601String(),
            'attended_students' => $this->when($this->ended_at !== null, function () {
                return $this->results()
                    ->with('student')
                    ->whereNotNull('attempt_id')
                    ->get()
                    ->map(function ($result) {
                        return [
                            'student_id' => $result->student_id,
                            'student_name' => $result->student->name,
                            'score' => $result->score,
                            'percentage' => $result->percentage,
                        ];
                    });
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
