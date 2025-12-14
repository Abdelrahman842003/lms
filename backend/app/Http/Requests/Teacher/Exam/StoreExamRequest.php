<?php

namespace App\Http\Requests\Teacher\Exam;

use Illuminate\Foundation\Http\FormRequest;

class StoreExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'date' => 'required|date',
            'duration' => 'required|integer|min:1',
            'total_marks' => 'required|integer|min:1',
            'actual_question_count' => 'required|integer|min:1',
            'time_per_question' => 'required|integer|min:10|max:600', // 10 seconds to 10 minutes
            'questions' => 'required|array|min:1',
            'questions.*.text' => 'required|string',
            'questions.*.options' => 'required|array|min:4|max:4',
            'questions.*.correct_answer' => 'required|string',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'title' => strip_tags($this->input('title')),
            'subject' => strip_tags($this->input('subject')),
        ]);
    }
}
