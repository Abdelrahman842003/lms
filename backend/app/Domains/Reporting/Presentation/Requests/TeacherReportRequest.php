<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Requests;

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
            'preset' => 'sometimes|string|in:' . implode(',', [
                'today',
                'last_7_days',
                'this_month',
                'last_month',
                'last_3_months',
                'this_year',
                'custom_range',
            ]),
            'start_at' => 'required_if:preset,custom_range|date',
            'end_at' => 'required_if:preset,custom_range|date|after_or_equal:start_at',
            'comparison_mode' => 'sometimes|string|in:previous_period,same_period_last_year',
            'group_id' => 'sometimes|string|uuid',
            'student_activity_state' => 'sometimes|string|in:active,inactive',
            'attendance_state' => 'sometimes|string|in:good,poor',
        ];
    }

    public function messages(): array
    {
        return [
            'preset.in' => 'قيمة الفترة غير صالحة',
            'start_at.required_if' => 'تاريخ البداية مطلوب للنطاق المخصص',
            'start_at.date' => 'صيغة تاريخ البداية غير صحيحة',
            'end_at.required_if' => 'تاريخ النهاية مطلوب للنطاق المخصص',
            'end_at.date' => 'صيغة تاريخ النهاية غير صحيحة',
            'end_at.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية',
            'comparison_mode.in' => 'وضع المقارنة غير صالح',
            'group_id.uuid' => 'معرف المجموعة غير صالح',
        ];
    }

    public function filters(): array
    {
        return array_filter([
            'preset' => $this->input('preset'),
            'start_at' => $this->input('start_at'),
            'end_at' => $this->input('end_at'),
            'comparison_mode' => $this->input('comparison_mode'),
            'entity_type' => 'teacher',
            'group_id' => $this->input('group_id'),
            'student_activity_state' => $this->input('student_activity_state'),
            'attendance_state' => $this->input('attendance_state'),
        ], fn(mixed $value): bool => $value !== null);
    }
}
