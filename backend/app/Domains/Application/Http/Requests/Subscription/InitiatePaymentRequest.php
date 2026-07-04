<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class InitiatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'package_id' => ['required', 'uuid', 'exists:pricing_packages,id'],
            'plan_type' => ['required', 'string', 'in:monthly,quarterly,semi_annual,annual'],
            'payment_method' => ['required', 'string', 'in:instapay,vodafone_cash'],
            'sender_phone' => ['nullable', 'string', 'max:20'],
            'sender_name' => ['nullable', 'string', 'max:100'],
        ];
    }
}
