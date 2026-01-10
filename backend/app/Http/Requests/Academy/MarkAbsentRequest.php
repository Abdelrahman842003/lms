<?php

declare(strict_types=1);

namespace App\Http\Requests\Academy;

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
            'teacher_id' => 'required|exists:teachers,id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'teacher_id.required' => 'المدرس مطلوب',
            'teacher_id.exists' => 'المدرس غير موجود',
            'date.required' => 'التاريخ مطلوب',
            'date.date' => 'التاريخ غير صحيح',
        ];
    }
}
