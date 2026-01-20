<?php

declare(strict_types=1);

namespace App\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $teacherId = $this->route('teacher') ?? $this->route('id');

        return [
            'name' => ['required', 'string', 'min:3'],
            'phone' => [
                'required',
                'string',
                'regex:/^01[0-9]{9}$/',
                Rule::unique('teachers', 'phone')->ignore($teacherId),
            ],
            'password' => ['nullable', 'string', 'min:6'],
            'subject' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'الاسم مطلوب',
            'name.string' => 'الاسم يجب أن يكون نصاً',
            'name.min' => 'الاسم يجب أن يكون 3 أحرف على الأقل',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.unique' => 'رقم الهاتف مستخدم بالفعل',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ];
    }
}
