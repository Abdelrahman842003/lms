<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher\PaymentLog;

use Illuminate\Foundation\Http\FormRequest;

class SyncPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payments' => 'required|array|max:50',
            'payments.*.client_side_uuid' => 'required|uuid',
            'payments.*.student_id' => 'required|uuid',
            'payments.*.amount' => 'required|numeric|min:1',
            'payments.*.confirmation_code' => 'required|string|max:20',
            'payments.*.created_at' => 'required|date',
            'payments.*.notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'payments.required' => 'قائمة المدفوعات مطلوبة',
            'payments.array' => 'صيغة البيانات غير صحيحة',
            'payments.max' => 'لا يمكن مزامنة أكثر من 50 عملية في المرة الواحدة',
            'payments.*.client_side_uuid.required' => 'معرف العملية مطلوب',
            'payments.*.student_id.required' => 'معرف الطالب مطلوب',
            'payments.*.amount.required' => 'المبلغ مطلوب',
            'payments.*.amount.min' => 'المبلغ يجب أن يكون أكبر من صفر',
            'payments.*.confirmation_code.required' => 'كود التأكيد مطلوب',
            'payments.*.created_at.required' => 'تاريخ العملية مطلوب',
        ];
    }
}
