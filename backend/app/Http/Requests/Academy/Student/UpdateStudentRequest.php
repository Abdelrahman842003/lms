<?php

declare(strict_types=1);

namespace App\Http\Requests\Academy\Student;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'parent_phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
            'grade_id' => ['sometimes', 'nullable', 'exists:grades,id'],
            'group_id' => ['sometimes', 'nullable', 'exists:groups,id'],
            'gender' => ['sometimes', 'nullable', 'in:male,female'],
            'education_type' => ['sometimes', 'nullable', 'string'],
            'location' => ['sometimes', 'nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'grade_id.exists' => 'الصف الدراسي المختار غير موجود',
            'group_id.exists' => 'المجموعة المختارة غير موجودة',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ];
    }
}
