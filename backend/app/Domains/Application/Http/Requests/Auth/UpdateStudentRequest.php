<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Auth;

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
            'password' => ['nullable', 'confirmed', 'min:6'],
        ];
    }
}
