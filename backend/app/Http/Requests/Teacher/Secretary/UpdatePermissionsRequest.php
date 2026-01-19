<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher\Secretary;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'permissions' => 'array',
            'permissions.*' => 'string',
        ];
    }

    public function messages(): array
    {
        return [
            'permissions.array' => 'صيغة الصلاحيات غير صحيحة',
        ];
    }
}
