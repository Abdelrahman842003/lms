<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class GetAttendanceRequest extends FormRequest
{
    /**
     * Determine if user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get validation rules that apply to request.
     */
    public function rules(): array
    {
        return [
            'teacher_profile_id' => [
                'required',
                function ($attribute, $value, $fail) {
                    $exists = \App\Domains\Auth\Models\TeacherProfile::where('id', $value)
                        ->orWhere('uuid', $value)
                        ->exists();
                    if (!$exists) {
                        $fail('المدرس غير موجود');
                    }
                }
            ],
            'per_page' => 'nullable|integer|min:1|max:100',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'teacher_profile_id.required' => 'معرف المدرس مطلوب',
            'teacher_profile_id.uuid' => 'معرف المدرس غير صالح',
            'teacher_profile_id.exists' => 'المدرس غير موجود',
            'per_page.integer' => 'عدد العناصر يجب أن يكون رقماً',
            'per_page.min' => 'عدد العناصر يجب أن يكون على الأقل 1',
            'per_page.max' => 'عدد العناصر يجب أن يكون على الأكثر 100',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'خطأ في التحقق من البيانات',
                'errors' => $validator->errors()
            ], 422)
        );
    }
}
