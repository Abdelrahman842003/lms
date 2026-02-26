<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Permission;

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
            'name' => 'required|string|max:255',
            'guard_name' => 'required|in:student,secretary',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم الصلاحية مطلوب',
            'guard_name.required' => 'نوع الصلاحية مطلوب',
            'guard_name.in' => 'نوع الصلاحية غير صحيح',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'name' => strip_tags($this->input('name')),
        ]);
    }
}
