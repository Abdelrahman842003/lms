<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Academy;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'in:trial,term,custom'],
            'days' => ['required_if:type,trial,custom', 'integer', 'min:1'],
            'months' => ['required_if:type,term', 'integer', 'min:1'],
            'max_students' => ['nullable', 'integer', 'min:0'],
            'is_unlimited_students' => ['boolean'],
            'is_paid' => ['boolean'],
        ];
    }
}
