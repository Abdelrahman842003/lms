<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher\Payment;

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
            'student_id' => ['required', 'string', 'exists:students,id'],
            'months' => ['required', 'integer', 'min:1', 'max:12'],
            'discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
            'client_side_uuid' => ['required', 'uuid'],
            'start_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => 'الطالب مطلوب',
            'student_id.exists' => 'الطالب غير موجود',
            'months.required' => 'عدد الشهور مطلوب',
            'months.integer' => 'عدد الشهور يجب أن يكون رقماً صحيحاً',
            'months.min' => 'عدد الشهور يجب أن يكون 1 على الأقل',
            'months.max' => 'عدد الشهور يجب ألا يتجاوز 12 شهر',
            'discount.numeric' => 'الخصم يجب أن يكون رقماً',
            'discount.min' => 'الخصم لا يمكن أن يكون أقل من 0',
            'discount.max' => 'الخصم لا يمكن أن يكون أكثر من 100%',
            'notes.max' => 'الملاحظات يجب ألا تتجاوز 500 حرف',
            'client_side_uuid.required' => 'معرف العملية مطلوب',
            'client_side_uuid.uuid' => 'معرف العملية غير صحيح',
        ];
    }
}
