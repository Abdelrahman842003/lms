<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class MarkAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => 'required|string|min:5',
        ];
    }

    public function messages(): array
    {
        return [
            'token.required' => 'كود الحضور مطلوب',
            'token.min' => 'كود الحضور غير صحيح',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'token' => clean_input($this->input('token')),
        ]);
    }
}
