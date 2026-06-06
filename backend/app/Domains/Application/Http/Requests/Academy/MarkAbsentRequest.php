<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;

class MarkAbsentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id' => 'required_without:teacher_profile_id|exists:teachers,id',
            'teacher_profile_id' => 'required_without:teacher_id|exists:teacher_profiles,id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'teacher_id.required_without' => 'المدرس مطلوب',
            'teacher_id.exists' => 'المدرس غير موجود',
            'teacher_profile_id.required_without' => 'المدرس مطلوب',
            'teacher_profile_id.exists' => 'المدرس غير موجود',
            'date.required' => 'التاريخ مطلوب',
            'date.date' => 'التاريخ غير صحيح',
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge(\App\Domains\Application\Traits\ResolvesTeacher::resolveTeacherInput($this));
    }
}
