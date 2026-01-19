<?php

declare(strict_types=1);

namespace App\Http\Requests\Academy\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:6'],
            'teacher_id' => ['required', 'exists:teachers,id'],
            'grade_id' => ['nullable', 'exists:grades,id'],
            'group_id' => ['nullable', 'exists:groups,id'],
            'gender' => ['nullable', 'in:male,female'],
            'education_type' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم الطالب مطلوب',
            'teacher_id.required' => 'المدرس مطلوب',
            'teacher_id.exists' => 'المدرس المختار غير موجود',
            'grade_id.exists' => 'الصف الدراسي المختار غير موجود',
            'group_id.exists' => 'المجموعة المختارة غير موجودة',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ];
    }
}
