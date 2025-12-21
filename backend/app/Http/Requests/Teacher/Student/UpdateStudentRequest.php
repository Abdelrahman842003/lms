<?php

namespace App\Http\Requests\Teacher\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $teacher = $this->user();
        $student = $this->route('student');

        return [
            'name' => 'sometimes|required|string|max:255',
            'password' => 'nullable|string|min:6',
            'grade_id' => 'nullable|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
            'location' => 'nullable|string|max:255',
        ];
    }

    public function prepareForValidation()
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => strip_tags($this->input('name')),
            ]);
        }
    }
}
