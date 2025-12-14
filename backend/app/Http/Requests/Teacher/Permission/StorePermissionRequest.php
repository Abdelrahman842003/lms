<?php

namespace App\Http\Requests\Teacher\Permission;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string',
            'guard_name' => 'required|in:student,secretary',
        ];
    }
}
