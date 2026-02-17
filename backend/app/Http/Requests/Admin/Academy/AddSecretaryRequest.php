<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Academy;

use Illuminate\Foundation\Http\FormRequest;

class AddSecretaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'secretary_id' => ['required', 'exists:secretaries,id'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ];
    }
}
