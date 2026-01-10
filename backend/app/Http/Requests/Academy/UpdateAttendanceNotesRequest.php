<?php

declare(strict_types=1);

namespace App\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceNotesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'notes.required' => 'الملاحظات مطلوبة',
            'notes.string' => 'الملاحظات يجب أن تكون نصاً',
        ];
    }
}
