<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Admin\Report;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

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
        // Check if this is a legacy endpoint (teacher/{id}, academy/{id}, admin, or admin/pdf)
        // Must NOT match /generate (unified endpoint that requires report_type in the body)
        $url = $this->url();
        $isLegacyEndpoint = str_contains($url, '/teacher/') ||
                           str_contains($url, '/academy/') ||
                           (str_contains($url, '/admin') && !str_ends_with($url, '/generate'));
        
        // DEBUG: Log request details for troubleshooting
        \Log::info('[GenerateReportRequest] Validation check', [
            'url' => $this->url(),
            'is_legacy' => $isLegacyEndpoint,
            'all_input' => $this->all(),
            'query_params' => $this->query(),
            'report_type' => $this->input('report_type'),
            'period_preset' => $this->input('period_preset'),
            'start_date' => $this->input('start_date'),
            'end_date' => $this->input('end_date'),
        ]);
        
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
                Rule::in(['last_month', 'last_3_months', 'last_6_months', 'last_year', 'custom']),
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
            'last_3_months' => [
                'start_date' => $today->copy()->subMonths(2)->startOfMonth(),
                'end_date' => $today->copy()->endOfDay(),
            ],
            'last_6_months' => [
                'start_date' => $today->copy()->subMonths(5)->startOfMonth(),
                'end_date' => $today->copy()->endOfDay(),
            ],
            'last_year' => [
                'start_date' => $today->copy()->subYear()->startOfMonth(),
                'end_date' => $today->copy()->endOfDay(),
            ],
            default => [
                'start_date' => \Carbon\Carbon::create(2020, 1, 1)->startOfDay(),
                'end_date' => $today->copy()->endOfDay(),
            ],
        };
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param Validator $validator
     * @throws HttpResponseException
     */
    protected function failedValidation(Validator $validator): void
    {
        \Log::error('[GenerateReportRequest] Validation FAILED', [
            'url' => $this->url(),
            'errors' => $validator->errors()->toArray(),
            'all_input' => $this->all(),
        ]);

        throw new HttpResponseException(
            response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}
