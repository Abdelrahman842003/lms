<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\SyncError;

use Illuminate\Foundation\Http\FormRequest;

class BulkResolveSyncErrorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => 'required|array|max:50',
            'ids.*' => 'uuid',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'يجب تحديد العناصر',
            'ids.array' => 'صيغة العناصر غير صحيحة',
            'ids.max' => 'لا يمكن تحديد أكثر من 50 عنصر',
            'ids.*.uuid' => 'معرف العنصر غير صحيح',
            'notes.string' => 'الملاحظات يجب أن تكون نصاً',
            'notes.max' => 'الملاحظات يجب ألا تتجاوز 1000 حرف',
        ];
    }

    public function prepareForValidation()
    {
        if ($this->has('notes')) {
            $this->merge([
                'notes' => clean_input($this->input('notes')),
            ]);
        }
    }
}
