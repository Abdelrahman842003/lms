<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|min:2|max:100|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم الدور مطلوب',
            'name.min' => 'اسم الدور يجب أن يكون حرفين على الأقل',
            'name.max' => 'اسم الدور طويل جداً',
            'name.unique' => 'هذا الدور موجود بالفعل',
            'permissions.*.exists' => 'إحدى الصلاحيات المحددة غير موجودة',
        ];
    }
}
