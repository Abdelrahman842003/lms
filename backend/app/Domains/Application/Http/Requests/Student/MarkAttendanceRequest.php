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
            'code' => 'required|string|size:6',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'كود الحضور مطلوب',
            'code.size' => 'كود الحضور يجب أن يكون 6 أرقام',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'code' => clean_input($this->input('code')),
        ]);
    }
}
