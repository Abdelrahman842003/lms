<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher\Student;

use Illuminate\Foundation\Http\FormRequest;

class SearchByPhoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string'],
            'academy_id' => ['nullable', 'string'],
            'grade_id' => ['nullable', 'string', 'exists:grades,id'],
        ];
    }
}
