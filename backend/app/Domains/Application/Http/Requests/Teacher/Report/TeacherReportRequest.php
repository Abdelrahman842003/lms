<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Report;

use Illuminate\Foundation\Http\FormRequest;

class TeacherReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ];
    }

    public function messages(): array
    {
        return [
            'start_date.required' => 'تاريخ البداية مطلوب',
            'start_date.date' => 'صيغة تاريخ البداية غير صحيحة',
            'end_date.required' => 'تاريخ النهاية مطلوب',
            'end_date.date' => 'صيغة تاريخ النهاية غير صحيحة',
            'end_date.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية',
        ];
    }
}
