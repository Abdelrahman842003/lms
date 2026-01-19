<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class DashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'limit' => 'sometimes|integer|min:1|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            'limit.integer' => 'الحد يجب أن يكون رقماً صحيحاً',
            'limit.min' => 'الحد يجب أن يكون 1 على الأقل',
            'limit.max' => 'الحد لا يمكن أن يزيد عن 50',
        ];
    }
}
