<?php

namespace App\Http\Requests\Admin;

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
            'name' => 'required|string|min:3|max:255',
            'phone' => [
                'required',
                'regex:/^01[0125][0-9]{8}$/',
                Rule::unique('teachers', 'phone')->ignore($teacherId)
            ],
            'password' => 'nullable|string|min:6|confirmed',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'الاسم مطلوب',
            'name.min' => 'الاسم يجب أن يكون 3 أحرف على الأقل',
            'name.max' => 'الاسم طويل جداً',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.regex' => 'رقم الهاتف يجب أن يكون رقم مصري صحيح (01xxxxxxxxx)',
            'phone.unique' => 'رقم الهاتف مسجل بالفعل',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'password.confirmed' => 'كلمة المرور غير متطابقة',
        ];
    }
}
