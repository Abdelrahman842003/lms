<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $studentId = $this->route('student'); // Assuming the route parameter is 'student'

        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'max:255',
                // Unique username per teacher, ignoring the current student
                Rule::unique('students')->where(function ($query) {
                    return $query->where('teacher_id', $this->student->teacher_id);
                })->ignore($this->student->id),
            ],
            'password' => ['nullable', 'confirmed', 'min:6'],
        ];
    }
}
