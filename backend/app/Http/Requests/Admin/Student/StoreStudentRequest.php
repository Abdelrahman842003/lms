<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:students,phone',
            'password' => 'required|string|min:6|confirmed',
            'teacher_id' => 'nullable|exists:teachers,id',
        ];
    }
}
