<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class RecordPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['nullable', 'string', 'in:cash,bank_transfer,online,other'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'amount' => 'المبلغ',
            'payment_method' => 'طريقة الدفع',
            'notes' => 'ملاحظات',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'مبلغ الدفع مطلوب',
            'amount.numeric' => 'المبلغ يجب أن يكون رقماً',
            'amount.min' => 'المبلغ يجب أن يكون أكبر من صفر',
            'payment_method.in' => 'طريقة الدفع غير صالحة',
            'notes.max' => 'الملاحظات يجب ألا تتجاوز 1000 حرف',
        ];
    }
}