<?php

declare(strict_types=1);

namespace App\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSecretaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $secretaryId = $this->route('secretary');
        
        return [
            'name' => 'sometimes|string|max:255',
            'phone' => "sometimes|string|max:20|unique:secretaries,phone,{$secretaryId}",
            'password' => 'sometimes|string|min:6',
            'avatar_key' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'الاسم يجب ألا يتجاوز 255 حرف',
            'phone.unique' => 'رقم الهاتف مستخدم بالفعل',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ];
    }
}
