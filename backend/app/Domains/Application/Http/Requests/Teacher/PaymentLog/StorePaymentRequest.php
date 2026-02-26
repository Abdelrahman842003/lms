<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\PaymentLog;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|uuid|exists:students,id',
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string|max:500',
            'client_side_uuid' => 'required|uuid',
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => 'الطالب مطلوب',
            'student_id.exists' => 'الطالب غير موجود',
            'amount.required' => 'المبلغ مطلوب',
            'amount.numeric' => 'المبلغ يجب أن يكون رقماً',
            'amount.min' => 'المبلغ يجب أن يكون أكبر من صفر',
            'client_side_uuid.required' => 'معرف العملية مطلوب',
        ];
    }
}
