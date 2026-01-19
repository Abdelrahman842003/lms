<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:20|unique:teachers,phone,' . $this->user()->id,
            'email' => 'sometimes|nullable|email|max:255|unique:teachers,email,' . $this->user()->id,
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'الاسم مطلوب',
            'name.string' => 'الاسم يجب أن يكون نصاً',
            'name.max' => 'الاسم لا يمكن أن يزيد عن 255 حرفاً',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.string' => 'رقم الهاتف يجب أن يكون نصاً',
            'phone.max' => 'رقم الهاتف لا يمكن أن يزيد عن 20 حرفاً',
            'phone.unique' => 'رقم الهاتف مستخدم من قبل',
            'email.email' => 'البريد الإلكتروني غير صحيح',
            'email.max' => 'البريد الإلكتروني لا يمكن أن يزيد عن 255 حرفاً',
            'email.unique' => 'البريد الإلكتروني مستخدم من قبل',
        ];
    }
}
