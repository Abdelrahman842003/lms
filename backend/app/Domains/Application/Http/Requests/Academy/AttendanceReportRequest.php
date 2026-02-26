<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;

class AttendanceReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_from' => 'required|date',
            'date_to' => 'required|date',
            'teacher_id' => 'nullable|exists:teachers,id',
        ];
    }

    public function messages(): array
    {
        return [
            'date_from.required' => 'تاريخ البداية مطلوب',
            'date_from.date' => 'تاريخ البداية غير صحيح',
            'date_to.required' => 'تاريخ النهاية مطلوب',
            'date_to.date' => 'تاريخ النهاية غير صحيح',
            'teacher_id.exists' => 'المدرس غير موجود',
        ];
    }
}
