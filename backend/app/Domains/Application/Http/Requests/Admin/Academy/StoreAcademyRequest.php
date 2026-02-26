<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Admin\Academy;

use Illuminate\Foundation\Http\FormRequest;

class StoreAcademyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Handle authorization in middleware/policy
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'unique:academies,phone'],
            'password' => ['required', 'string', 'min:8'],
            'email' => ['nullable', 'email', 'max:255'],
            'logo_key' => ['nullable', 'string'],
            'billing_notes' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم الأكاديمية مطلوب',
            'name.max' => 'اسم الأكاديمية يجب ألا يتجاوز 255 حرف',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.unique' => 'رقم الهاتف مستخدم بالفعل',
            'email.email' => 'البريد الإلكتروني غير صحيح',
        ];
    }
}
