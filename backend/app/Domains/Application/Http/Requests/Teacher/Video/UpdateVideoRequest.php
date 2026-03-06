<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Video;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'grade_id' => ['sometimes', 'required', 'exists:grades,id'],
            'group_ids' => ['sometimes', 'array'],
            'group_ids.*' => ['exists:groups,id'],
            'lecture_id' => ['sometimes', 'nullable', 'exists:lectures,id'],
            'lesson_id' => ['sometimes', 'nullable', 'uuid'],
            'scheduled_at' => ['sometimes', 'nullable', 'date'],
            'available_from' => ['sometimes', 'nullable', 'date'],
            'available_until' => ['sometimes', 'nullable', 'date', 'after_or_equal:available_from'],
        ];
    }
}
