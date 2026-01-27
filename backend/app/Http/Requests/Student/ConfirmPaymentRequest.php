<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enrollment_id' => 'required|exists:enrollments,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string|in:cash,vodafone,fawry',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'enrollment_id.required' => 'يجب تحديد الاشتراك',
            'enrollment_id.exists' => 'الاشتراك غير موجود',
            'amount.required' => 'المبلغ مطلوب',
            'amount.numeric' => 'المبلغ يجب أن يكون رقماً',
            'amount.min' => 'المبلغ يجب أن يكون أكبر من صفر',
            'payment_method.in' => 'طريقة الدفع غير صحيحة',
            'notes.max' => 'الملاحظات طويلة جداً',
        ];
    }
}
