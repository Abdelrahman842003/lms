<?php

namespace App\Http\Requests\Teacher\PaymentLog;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'student_id' => 'required|uuid|exists:students,id',
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string|max:500',
            'client_side_uuid' => 'required|uuid',
        ];
    }
}
