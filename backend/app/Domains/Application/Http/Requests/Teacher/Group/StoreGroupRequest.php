<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Group;

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
            'name' => 'required|string|min:2|max:255',
            'grade_id' => 'required|exists:grades,id',
            'time' => 'nullable|string|max:255',
            'days' => 'nullable|string|max:255',
            'type' => 'required|in:public,private,general',
            'price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'academy_id' => 'nullable|exists:academies,id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم المجموعة مطلوب',
            'name.min' => 'اسم المجموعة قصير جداً',
            'grade_id.required' => 'الصف الدراسي مطلوب',
            'grade_id.exists' => 'الصف الدراسي غير موجود',
            'type.required' => 'نوع المجموعة مطلوب',
            'type.in' => 'نوع المجموعة يجب أن يكون عام أو خاص',
            'price.numeric' => 'السعر يجب أن يكون رقماً',
            'price.min' => 'السعر يجب أن يكون أكبر من صفر',
            'academy_id.exists' => 'الأكاديمية غير موجودة',
        ];
    }

    public function prepareForValidation()
    {
        $type = $this->input('type');
        if ($type === 'general') {
            $type = 'public';
        }

        $this->merge([
            'name' => strip_tags($this->input('name')),
            'description' => $this->input('description') ? strip_tags($this->input('description')) : null,
            'time' => $this->input('time') ? strip_tags($this->input('time')) : null,
            'days' => $this->input('days') ? strip_tags($this->input('days')) : null,
            'type' => $type,
        ]);
    }
}
