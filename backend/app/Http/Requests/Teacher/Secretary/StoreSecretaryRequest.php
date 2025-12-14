<?php

namespace App\Http\Requests\Teacher\Secretary;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSecretaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('secretaries'),
            ],
            'password' => 'required|string|min:6',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'name' => strip_tags($this->input('name')),
            'phone' => strip_tags($this->input('phone')),
            'username' => strip_tags($this->input('username')),
        ]);
    }
}
