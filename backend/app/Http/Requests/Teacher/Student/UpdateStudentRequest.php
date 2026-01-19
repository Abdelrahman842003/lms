<?php

declare(strict_types=1);

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
        return [
            'name' => 'sometimes|required|string|min:3|max:255',
            'password' => 'nullable|string|min:6',
            'grade_id' => 'nullable|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
            'location' => 'nullable|string|max:255',
            'phone' => ['nullable', 'regex:/^01[0125][0-9]{8}$/'],
            'parent_phone' => ['nullable', 'regex:/^01[0125][0-9]{8}$/'],
            'gender' => 'nullable|in:male,female',
            'education_type' => 'nullable|in:general,azhar',
            'balance' => 'nullable|numeric',
            'subscription_start' => 'nullable|date',
            'subscription_end' => 'nullable|date',
            'teacher_notes' => 'nullable|string',
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
            'phone.regex' => 'رقم الهاتف يجب أن يكون رقم مصري صحيح (01xxxxxxxxx)',
            'parent_phone.regex' => 'رقم ولي الأمر يجب أن يكون رقم مصري صحيح',
            'gender.in' => 'النوع يجب أن يكون ذكر أو أنثى',
            'education_type.in' => 'نوع التعليم يجب أن يكون عام أو أزهري',
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

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->group_id) {
                $gradeId = $this->grade_id;
                
                // If grade_id is not in request, get it from the enrollment
                if (!$gradeId) {
                    $teacher = $this->user();
                    // Assuming the route parameter is 'student' (the ID)
                    $studentId = $this->route('student');
                    
                    // We need to find the enrollment to get the current grade_id
                    // Note: This query might be duplicated in controller, but it's safe for validation
                    $enrollment = \Illuminate\Support\Facades\DB::table('enrollments')
                        ->where('teacher_id', $teacher->id)
                        ->where('student_id', $studentId)
                        ->first();
                        
                    if ($enrollment) {
                        $gradeId = $enrollment->grade_id;
                    }
                }

                if ($gradeId) {
                    $group = \App\Models\Group::find($this->group_id);
                    if ($group && $group->grade_id != $gradeId) {
                        $validator->errors()->add('group_id', 'المجموعة المختارة لا تنتمي للصف الدراسي المحدد');
                    }
                }
            }
        });
    }
}
