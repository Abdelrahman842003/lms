<?php

namespace App\Http\Requests\Teacher\Secretary;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSecretaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $secretary = $this->route('secretary');
        
        return [
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:20',
            'username' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('secretaries')->ignore($secretary),
            ],
            'password' => 'nullable|string|min:6',
        ];
    }

    public function prepareForValidation()
    {
        if ($this->has('name')) {
            $this->merge(['name' => strip_tags($this->input('name'))]);
        }
        if ($this->has('phone')) {
            $this->merge(['phone' => strip_tags($this->input('phone'))]);
        }
        if ($this->has('username')) {
            $this->merge(['username' => strip_tags($this->input('username'))]);
        }
    }
}
