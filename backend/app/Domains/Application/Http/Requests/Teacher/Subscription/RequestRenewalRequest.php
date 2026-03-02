<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class RequestRenewalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plan_selection' => ['required', 'string', 'in:trial,monthly,quarterly,semi_annual,annual,custom'],
            'custom_months' => ['nullable', 'integer', 'min:1', 'max:120'],
        ];
    }
}
