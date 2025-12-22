<?php

namespace App\Http\Requests\Teacher\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $teacher = $this->user();
        $student = $this->route('student');

        return [
            'name' => 'sometimes|required|string|min:3|max:255',
            'password' => 'nullable|string|min:6',
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
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'grade_id.exists' => 'الصف الدراسي غير موجود',
            'group_id.exists' => 'المجموعة غير موجودة',
        ];
    }

    public function prepareForValidation()
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => strip_tags($this->input('name')),
            ]);
        }
    }
}
