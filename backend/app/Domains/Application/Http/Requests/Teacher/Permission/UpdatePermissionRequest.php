<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Permission;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم الصلاحية مطلوب',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'name' => clean_input($this->input('name')),
        ]);
    }
}
