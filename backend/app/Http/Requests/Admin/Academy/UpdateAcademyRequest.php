<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Academy;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAcademyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $academyId = $this->route('academy');
        
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'unique:academies,phone,' . $academyId],
            'email' => ['nullable', 'email', 'max:255'],
            'logo_key' => ['nullable', 'string'],
            'billing_notes' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'اسم الأكاديمية يجب ألا يتجاوز 255 حرف',
            'phone.unique' => 'رقم الهاتف مستخدم بالفعل',
            'email.email' => 'البريد الإلكتروني غير صحيح',
        ];
    }
}
