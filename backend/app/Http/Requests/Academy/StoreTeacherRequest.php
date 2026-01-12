<?php

declare(strict_types=1);

namespace App\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;

class StoreTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        if ($this->has('teacher_id')) {
            return [
                'teacher_id' => ['required', 'string', 'exists:teachers,id'],
            ];
        }

        return [
            'name' => ['required', 'string', 'min:3'],
            'phone' => ['required', 'string', 'regex:/^01[0-9]{9}$/', 'unique:teachers,phone'],
            'password' => ['required', 'string', 'min:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'teacher_id.required' => 'معرف المدرس مطلوب',
            'teacher_id.exists' => 'المدرس غير موجود',
            'name.required' => 'الاسم مطلوب',
            'name.string' => 'الاسم يجب أن يكون نصاً',
            'name.min' => 'الاسم يجب أن يكون 3 أحرف على الأقل',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.unique' => 'رقم الهاتف مستخدم بالفعل',
            'password.required' => 'كلمة المرور مطلوبة',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ];
    }
}
