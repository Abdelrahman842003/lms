<?php

declare(strict_types=1);

namespace App\Http\Requests\Student\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
class StudentDashboardRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'teacher_id' => 'required|exists:teachers,id',
        ];
    }
}
