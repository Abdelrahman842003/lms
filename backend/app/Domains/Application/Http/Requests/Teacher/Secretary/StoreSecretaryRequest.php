<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Secretary;

use Illuminate\Foundation\Http\FormRequest;

class StoreSecretaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6',
            'permissions' => 'array',
            'permissions.*' => 'string', // Assuming permissions are strings, not IDs checking against a table for now as per service logic
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم السكرتير مطلوب',
            'phone.required' => 'رقم الهاتف مطلوب',
            'password.required' => 'كلمة المرور مطلوبة',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'permissions.array' => 'صيغة الصلاحيات غير صحيحة',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'name' => clean_input($this->input('name')),
            'phone' => clean_input($this->input('phone')),
        ]);
    }
}
