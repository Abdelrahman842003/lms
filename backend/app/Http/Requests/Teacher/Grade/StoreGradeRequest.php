<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher\Grade;

use Illuminate\Foundation\Http\FormRequest;

class StoreGradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'academy_id' => 'nullable|exists:academies,id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم الصف الدراسي مطلوب',
            'price.required' => 'سعر الصف الدراسي مطلوب',
            'price.numeric' => 'سعر الصف الدراسي يجب أن يكون رقماً',
            'price.min' => 'سعر الصف الدراسي لا يمكن أن يكون أقل من 0',
            'academy_id.exists' => 'الأكاديمية غير موجودة',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'name' => strip_tags($this->input('name')),
            'description' => $this->input('description') ? strip_tags($this->input('description')) : null,
        ]);
    }
}
