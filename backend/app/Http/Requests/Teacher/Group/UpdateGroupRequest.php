<?php

namespace App\Http\Requests\Teacher\Group;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|min:2|max:255',
            'grade_id' => 'nullable|exists:grades,id',
            'time' => 'nullable|string|max:255',
            'days' => 'nullable|string|max:255',
            'type' => 'nullable|in:general,private',
            'price' => 'nullable|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم المجموعة مطلوب',
            'name.min' => 'اسم المجموعة قصير جداً',
            'grade_id.exists' => 'الصف الدراسي غير موجود',
            'type.in' => 'نوع المجموعة يجب أن يكون عام أو خاص',
            'price.numeric' => 'السعر يجب أن يكون رقماً',
            'price.min' => 'السعر يجب أن يكون أكبر من صفر',
        ];
    }
}
