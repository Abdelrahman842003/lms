<?php

namespace App\Http\Resources\Teacher;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResultDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Get failed questions directly from database
        $failedQuestions = \App\Models\FailedQuestion::where('student_id', $this->student_id)
            ->where('exam_id', $this->exam_id)
            ->with('question')
            ->get();

        $failedQuestionsArray = [];
        foreach ($failedQuestions as $failed) {
            if ($failed->question) {
                $failedQuestionsArray[] = [
                    'id' => $failed->id,
                    'question_text' => $failed->question->text ?? '',
                    'options' => $failed->question->options ?? [],
                    'correct_answer' => $failed->question->correct_answer ?? '',
                    'student_answer' => $failed->student_answer ?? '',
                ];
            }
        }

        return [
            'id' => $this->id,
            'student' => [
                'id' => $this->student->id ?? '',
                'name' => $this->student->name ?? 'غير معروف',
                'phone' => $this->student->phone ?? '',
            ],
            'score' => $this->score ?? 0,
            'percentage' => $this->percentage ?? 0,
            'failed_questions' => $failedQuestionsArray,
        ];
    }
}
