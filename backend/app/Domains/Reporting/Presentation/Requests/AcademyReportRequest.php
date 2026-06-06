<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AcademyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $presets = 'today,last_7_days,this_month,last_month,last_3_months,this_year,custom_range';
        return [
            'preset' => 'sometimes|string|in:' . $presets,
            'range' => 'sometimes|string|in:' . $presets,
            'start_at' => 'required_if:preset,custom_range|required_if:range,custom_range|date',
            'end_at' => 'required_if:preset,custom_range|required_if:range,custom_range|date|after_or_equal:start_at',
            'comparison_mode' => 'sometimes|string|in:previous_period,same_period_last_year',
            'teacher_id' => 'sometimes|string|uuid',
            'grade_id' => 'sometimes|string|uuid',
            'group_id' => 'sometimes|string|uuid',
            'student_status' => 'sometimes|string|in:active,inactive',
            'session_status' => 'sometimes|string|in:scheduled,delivered,canceled,postponed',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:100',
            'sort_column' => 'sometimes|string|max:255',
            'sort_direction' => 'sometimes|string|in:asc,desc',
        ];
    }

    public function messages(): array
    {
        return [
            'preset.in' => 'قيمة الفترة غير صالحة',
            'range.in' => 'قيمة الفترة غير صالحة',
            'start_at.required_if' => 'تاريخ البداية مطلوب للنطاق المخصص',
            'start_at.date' => 'صيغة تاريخ البداية غير صحيحةة',
            'end_at.required_if' => 'تاريخ النهاية مطلوب للنطاق المخصص',
            'end_at.date' => 'صيغة تاريخ النهاية غير صحيحةة',
            'end_at.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية',
            'comparison_mode.in' => 'وضع المقارنة غير صالح',
            'teacher_id.uuid' => 'معرف المعلم غير صالح',
            'grade_id.uuid' => 'معرف المرحلة غير صالح',
            'group_id.uuid' => 'معرف المجموعة غير صالح',
        ];
    }

    public function filters(): array
    {
        return array_filter([
            'preset' => $this->input('preset') ?? $this->input('range'),
            'start_at' => $this->input('start_at'),
            'end_at' => $this->input('end_at'),
            'comparison_mode' => $this->input('comparison_mode'),
            'entity_type' => 'academy',
            'teacher_id' => $this->input('teacher_id'),
            'grade_id' => $this->input('grade_id'),
            'group_id' => $this->input('group_id'),
            'student_status' => $this->input('student_status'),
            'session_status' => $this->input('session_status'),
        ], fn(mixed $value): bool => $value !== null);
    }
}
