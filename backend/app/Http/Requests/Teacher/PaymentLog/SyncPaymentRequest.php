<?php

namespace App\Http\Requests\Teacher\PaymentLog;

use Illuminate\Foundation\Http\FormRequest;

class SyncPaymentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
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
}
