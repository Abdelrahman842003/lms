<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher\Lecture;

use Illuminate\Foundation\Http\FormRequest;

class CancelSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by ResolvesTeacher trait
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date',
        ];
    }

    public function messages(): array
    {
        return [
            'date.required' => 'يجب تحديد تاريخ الجلسة المراد إلغاؤها',
            'date.date' => 'صيغة التاريخ غير صحيحة',
        ];
    }
}
