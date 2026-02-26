<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Grade;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم الصف الدراسي مطلوب',
            'name.string' => 'اسم الصف الدراسي يجب أن يكون نصاً',
            'name.max' => 'اسم الصف الدراسي يجب ألا يتجاوز 255 حرفاً',
            'price.required' => 'سعر الصف الدراسي مطلوب',
            'price.numeric' => 'سعر الصف الدراسي يجب أن يكون رقماً',
            'price.min' => 'سعر الصف الدراسي لا يمكن أن يكون أقل من 0',
        ];
    }
}
