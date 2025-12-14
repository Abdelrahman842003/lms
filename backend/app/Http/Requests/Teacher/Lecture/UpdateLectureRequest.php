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
            'date' => 'sometimes|date',
        ];
    }
}
