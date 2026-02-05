<?php

declare(strict_types=1);

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class SendNotificationRequest extends FormRequest
{
    /**
     * Determine if user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get validation rules that apply to request.
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'recipient_type' => 'required|in:admin',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'عنوان الإشعار مطلوب',
            'title.string' => 'عنوان الإشعار يجب أن يكون نصاً',
            'title.max' => 'عنوان الإشعار يجب أن لا يتجاوز 255 حرف',
            'message.required' => 'نص الإشعار مطلوب',
            'message.string' => 'نص الإشعار يجب أن يكون نصاً',
            'recipient_type.required' => 'نوع المستقبل مطلوب',
            'recipient_type.in' => 'نوع المستقبل غير صالح',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'خطأ في التحقق من البيانات',
                'errors' => $validator->errors()
            ], 422)
        );
    }
}
