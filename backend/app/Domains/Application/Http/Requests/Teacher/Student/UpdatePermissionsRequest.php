<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Student;

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
            'permissions.*' => 'exists:permissions,name',
        ];
    }
}
