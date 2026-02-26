<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\SyncError;

use Illuminate\Foundation\Http\FormRequest;

class ResolveSyncErrorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'notes.string' => 'الملاحظات يجب أن تكون نصاً',
            'notes.max' => 'الملاحظات يجب ألا تتجاوز 1000 حرف',
        ];
    }

    public function prepareForValidation()
    {
        if ($this->has('notes')) {
            $this->merge([
                'notes' => strip_tags($this->input('notes')),
            ]);
        }
    }
}
