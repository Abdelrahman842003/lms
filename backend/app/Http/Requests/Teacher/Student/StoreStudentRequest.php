<?php

namespace App\Http\Requests\Teacher\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
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
            'password' => 'nullable|string|min:6',
            'parent_phone' => 'nullable|string|max:20',
            'gender' => 'required|in:male,female',
            'education_type' => 'nullable|in:general,azhar',
            'grade_id' => 'nullable|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
            'location' => 'nullable|string|max:255',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'name' => strip_tags($this->input('name')),
            'phone' => strip_tags($this->input('phone')),
        ]);
    }
}
