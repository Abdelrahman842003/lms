<?php

declare(strict_types=1);

namespace App\Http\Resources\Teacher;

use App\Models\FailedQuestion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResultDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student' => $this->whenLoaded('student', fn() => [
                'id' => $this->student->id,
                'name' => $this->student->name,
                'phone' => $this->student->phone,
            ]),
            'score' => $this->score ?? 0,
            'percentage' => $this->percentage ?? 0,
            'failed_questions' => $this->getFailedQuestions(),
        ];
    }

    private function getFailedQuestions(): array
    {
        $failedQuestions = FailedQuestion::where('student_id', $this->student_id)
            ->where('exam_id', $this->exam_id)
            ->with('question')
            ->get();

        return $failedQuestions->filter(fn($failed) => $failed->question)
            ->map(fn($failed) => [
                'id' => $failed->id,
                'question_text' => $failed->question->text ?? '',
                'options' => $failed->question->options ?? [],
                'correct_answer' => $failed->question->correct_answer ?? '',
                'student_answer' => $failed->student_answer ?? '',
            ])->values()->toArray();
    }
}
