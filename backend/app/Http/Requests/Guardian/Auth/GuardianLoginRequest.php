<?php

namespace App\Http\Requests\Guardian\Auth;

use Illuminate\Foundation\Http\FormRequest;

class GuardianLoginRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'phone' => ['required', 'regex:/^01[0125][0-9]{8}$/'],
            'password' => 'required|string|min:6',
        ];
    }

    public function messages()
    {
        return [
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.regex' => 'رقم الهاتف يجب أن يكون رقم مصري صحيح',
            'password.required' => 'كلمة المرور مطلوبة',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ];
    }
}
