<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Lecture;

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
            'teacher_id' => ['sometimes', 'exists:teachers,id'],
            'teacher_profile_id' => ['sometimes', 'exists:teacher_profiles,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'grade_id' => ['sometimes', 'uuid', 'exists:grades,id'],
            'group_id' => ['nullable', 'uuid', 'exists:groups,id'],
            'date' => ['sometimes', 'date'],
            'is_recurring' => ['boolean'],
            'recurrence_days' => ['array'],
            'recurrence_time' => ['sometimes', 'date_format:H:i'],
            'duration_minutes' => ['sometimes', 'integer', 'min:1', 'max:480'],
        ];
    }

    public function messages(): array
    {
        return [
            'teacher_id.exists' => 'المدرس المختار غير موجود',
            'teacher_profile_id.exists' => 'المدرس المختار غير موجود',
            'grade_id.exists' => 'الصف الدراسي المختار غير موجود',
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge(\App\Domains\Application\Traits\ResolvesTeacher::resolveTeacherInput($this));
    }
}
