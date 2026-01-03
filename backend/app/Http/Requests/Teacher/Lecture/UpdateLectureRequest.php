<?php

namespace App\Http\Requests\Teacher\Lecture;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLectureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'grade_id' => 'sometimes|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
            'date' => 'nullable|date',
            'is_recurring' => 'boolean',
            'recurrence_days' => 'nullable|array',
            'recurrence_time' => 'nullable|date_format:H:i',
            'duration_minutes' => 'nullable|integer|min:1',
        ];
    }
}
