<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Report;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request for generating reports
 * Validates all report generation parameters
 */
final class GenerateReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        // Check if this is a legacy endpoint (teacher/{id}, academy/{id}, or admin)
        $isLegacyEndpoint = str_contains($this->url(), '/teacher/') ||
                           str_contains($this->url(), '/academy/') ||
                           str_ends_with($this->url(), '/admin');
        
        return [
            'report_type' => $isLegacyEndpoint
                ? ['nullable', 'string', Rule::in(['admin', 'teacher', 'academy'])]
                : ['required', 'string', Rule::in(['admin', 'teacher', 'academy'])],
            'teacher_id' => [
                'required_if:report_type,teacher',
                'string',
                'exists:teachers,id',
            ],
            'academy_id' => [
                'required_if:report_type,academy',
                'string',
                'exists:academies,id',
            ],
            'period_preset' => [
                'nullable',
                'string',
                Rule::in(['last_month', 'custom']),
            ],
            'start_date' => [
                'required_if:period_preset,custom',
                'date',
                'date_format:Y-m-d',
            ],
            'end_date' => [
                'required_if:period_preset,custom',
                'date',
                'date_format:Y-m-d',
                'after_or_equal:start_date',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'report_type.required' => 'نوع التقرير مطلوب',
            'report_type.in' => 'نوع التقرير غير صحيح',
            'teacher_id.required_if' => 'يرجى اختيار مدرس',
            'teacher_id.exists' => 'المدرس المختار غير موجود',
            'academy_id.required_if' => 'يرجى اختيار أكاديمية',
            'academy_id.exists' => 'الأكاديمية المختارة غير موجودة',
            'period_preset.required' => 'الفترة الزمنية مطلوبة',
            'period_preset.in' => 'الفترة الزمنية غير صحيحة',
            'start_date.required_if' => 'تاريخ البداية مطلوب للفترة المخصصة',
            'start_date.date_format' => 'تاريخ البداية يجب أن يكون بتنسيق YYYY-MM-DD',
            'end_date.required_if' => 'تاريخ النهاية مطلوب للفترة المخصصة',
            'end_date.date_format' => 'تاريخ النهاية يجب أن يكون بتنسيق YYYY-MM-DD',
            'end_date.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية',
        ];
    }

    /**
     * Get validated report type
     */
    public function getReportType(): string
    {
        return $this->validated('report_type');
    }

    /**
     * Get validated teacher ID
     */
    public function getTeacherId(): ?string
    {
        return $this->validated('teacher_id');
    }

    /**
     * Get validated academy ID
     */
    public function getAcademyId(): ?string
    {
        return $this->validated('academy_id');
    }

    /**
     * Get validated period preset
     */
    public function getPeriodPreset(): string
    {
        return $this->validated('period_preset') ?? 'last_month';
    }

    /**
     * Get date range based on period preset
     *
     * @return array{start_date: \Carbon\Carbon, end_date: \Carbon\Carbon}
     */
    public function getDateRange(): array
    {
        $preset = $this->getPeriodPreset();
        $today = now();

        return match ($preset) {
            'custom' => [
                'start_date' => \Carbon\Carbon::parse($this->validated('start_date'))->startOfDay(),
                'end_date' => \Carbon\Carbon::parse($this->validated('end_date'))->endOfDay(),
            ],
            default => [
                'start_date' => $today->copy()->startOfMonth(),
                'end_date' => $today->copy()->endOfDay(),
            ],
        };
    }
}
