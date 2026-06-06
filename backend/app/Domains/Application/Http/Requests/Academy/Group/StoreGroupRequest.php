<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Group;

use Illuminate\Foundation\Http\FormRequest;

class StoreGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'teacher_id' => ['required_without:teacher_profile_id', 'exists:teachers,id'],
            'teacher_profile_id' => ['required_without:teacher_id', 'exists:teacher_profiles,id'],
            'grade_id' => ['nullable', 'exists:grades,id'],
            'time' => ['nullable', 'string'],
            'days' => ['nullable', 'string'],
            'type' => ['required', 'in:public,private,general'],
            'price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم المجموعة مطلوب',
            'name.string' => 'اسم المجموعة يجب أن يكون نصاً',
            'name.max' => 'اسم المجموعة يجب ألا يتجاوز 255 حرفاً',
            'teacher_id.required_without' => 'المدرس مطلوب',
            'teacher_id.exists' => 'المدرس المختار غير موجود',
            'teacher_profile_id.required_without' => 'المدرس مطلوب',
            'teacher_profile_id.exists' => 'المدرس المختار غير موجود',
            'grade_id.exists' => 'الصف الدراسي المختار غير موجود',
            'type.required' => 'نوع المجموعة مطلوب',
            'type.in' => 'نوع المجموعة غير صحيح',
            'price.numeric' => 'سعر المجموعة يجب أن يكون رقماً',
            'price.min' => 'سعر المجموعة لا يمكن أن يكون أقل من 0',
        ];
    }

    public function prepareForValidation(): void
    {
        $type = $this->input('type');
        if ($type === 'general') {
            $type = 'public';
        }

        $mergeData = array_merge([
            'type' => $type,
        ], \App\Domains\Application\Traits\ResolvesTeacher::resolveTeacherInput($this));

        $this->merge($mergeData);
    }
}
