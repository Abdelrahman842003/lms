<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class AcademyLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'regex:/^01[0125][0-9]{8}$/'],
            'password' => 'required|min:6',
            'remember' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.regex' => 'رقم الهاتف يجب أن يكون رقم مصري صحيح (01xxxxxxxxx)',
            'password.required' => 'كلمة المرور مطلوبة',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ];
    }
}
