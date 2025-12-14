<?php

namespace App\Http\Requests\Student;

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
            'token' => 'required|string',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'token' => strip_tags($this->input('token')),
        ]);
    }
}
