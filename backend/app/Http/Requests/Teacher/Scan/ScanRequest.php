<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher\Scan;

use Illuminate\Foundation\Http\FormRequest;

class ScanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'qr_code' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'qr_code.required' => 'رمز QR مطلوب',
            'qr_code.string' => 'رمز QR يجب أن يكون نصاً',
        ];
    }
}
