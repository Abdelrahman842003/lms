<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class StudentLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'identifier' => 'required|string', // phone or username
            'password' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'identifier.required' => 'رقم الهاتف أو اسم المستخدم مطلوب',
            'password.required' => 'كلمة المرور مطلوبة',
        ];
    }
}
