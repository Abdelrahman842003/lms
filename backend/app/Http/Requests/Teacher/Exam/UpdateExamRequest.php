<?php

namespace App\Http\Requests\Teacher\Exam;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamRequest extends FormRequest
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
            'group_id' => 'nullable|exists:groups,id',
            'date' => 'required|date',
            'duration' => 'required|integer|min:1',
            'total_marks' => 'required|integer|min:1',
            'actual_question_count' => 'nullable|integer|min:1',
            'time_per_question' => 'nullable|integer|min:10|max:600',
            'questions' => 'nullable|array',
            'questions.*.text' => 'required_with:questions|string',
            'questions.*.options' => 'required_with:questions|array|min:4|max:4',
            'questions.*.correct_answer' => 'required_with:questions|string',
            'questions.*.duration' => 'required_with:questions|integer|min:10|max:600',
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
