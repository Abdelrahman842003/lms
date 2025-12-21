<?php

namespace App\Http\Requests\Teacher\Group;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'grade_id' => 'nullable|exists:grades,id',
            'time' => 'nullable|string|max:255',
            'days' => 'nullable|string|max:255',
            'type' => 'nullable|in:general,private',
            'price' => 'nullable|numeric|min:0',
        ];
    }
}
