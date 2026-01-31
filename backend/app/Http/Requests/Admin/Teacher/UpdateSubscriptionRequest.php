<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Teacher;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubscriptionRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'month' => 'required|date_format:Y-m',
            'payment_amount' => 'nullable|numeric|min:0',
        ];
    }
}
