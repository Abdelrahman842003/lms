<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Secretary;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSecretaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:20',
            'password' => 'nullable|string|min:6',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم السكرتير مطلوب',
            'phone.required' => 'رقم الهاتف مطلوب',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ];
    }

    public function prepareForValidation()
    {
        if ($this->has('name')) {
            $this->merge(['name' => clean_input($this->input('name'))]);
        }
        if ($this->has('phone')) {
            $this->merge(['phone' => clean_input($this->input('phone'))]);
        }
    }
}
