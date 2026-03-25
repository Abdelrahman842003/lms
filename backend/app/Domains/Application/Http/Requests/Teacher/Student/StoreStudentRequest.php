<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Student;

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
            'name' => 'required|string|min:3|max:255',
            'phone' => ['required', 'regex:/^01[0125][0-9]{8}$/'],
            'password' => 'nullable|string|min:6',
            'parent_phone' => ['nullable', 'regex:/^01[0125][0-9]{8}$/'],
            'gender' => 'required|in:male,female',
            'education_type' => 'nullable|in:general,azhar',
            'grade_id' => 'nullable|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
            'location' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'الاسم مطلوب',
            'name.min' => 'الاسم يجب أن يكون 3 أحرف على الأقل',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.regex' => 'رقم الهاتف يجب أن يكون رقم مصري صحيح (01xxxxxxxxx)',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'parent_phone.regex' => 'رقم ولي الأمر يجب أن يكون رقم مصري صحيح',
            'gender.required' => 'النوع مطلوب',
            'gender.in' => 'النوع يجب أن يكون ذكر أو أنثى',
            'education_type.in' => 'نوع التعليم يجب أن يكون عام أو أزهري',
            'grade_id.exists' => 'الصف الدراسي غير موجود',
            'group_id.exists' => 'المجموعة غير موجودة',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'name' => clean_input($this->input('name')),
            'phone' => clean_input($this->input('phone')),
        ]);
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->group_id && $this->grade_id) {
                $group = \App\Domains\Enrollments\Models\Group::find($this->group_id);
                if ($group && $group->grade_id != $this->grade_id) {
                    $validator->errors()->add('group_id', 'المجموعة المختارة لا تنتمي للصف الدراسي المحدد');
                }
            }
        });
    }
}
