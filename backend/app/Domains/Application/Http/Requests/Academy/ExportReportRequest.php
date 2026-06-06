<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;

class ExportReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'report_type' => 'required|in:attendance,teachers,monthly',
            'date_from' => 'required_if:report_type,attendance|date',
            'date_to' => 'required_if:report_type,attendance|date',
            'month' => 'required_if:report_type,monthly|integer|min:0|max:12',
            'year' => 'required_if:report_type,monthly|integer|min:2020',
            'teacher_id' => 'nullable|exists:teachers,id',
            'teacher_profile_id' => 'nullable|exists:teacher_profiles,id',
        ];
    }

    public function messages(): array
    {
        return [
            'report_type.required' => 'نوع التقرير مطلوب',
            'report_type.in' => 'نوع التقرير غير صحيح',
            'date_from.required_if' => 'تاريخ البداية مطلوب لتقرير الحضور',
            'date_to.required_if' => 'تاريخ النهاية مطلوب لتقرير الحضور',
            'month.required_if' => 'الشهر مطلوب للتقرير الشهري',
            'year.required_if' => 'السنة مطلوبة للتقرير الشهري',
            'teacher_id.exists' => 'المدرس غير موجود',
            'teacher_profile_id.exists' => 'المدرس غير موجود',
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge(\App\Domains\Application\Traits\ResolvesTeacher::resolveTeacherInput($this));
    }
}
