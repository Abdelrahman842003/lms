<?php

declare(strict_types=1);

namespace App\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;

class SendToTeachersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'nullable|in:info,warning,success,danger',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'العنوان مطلوب',
            'title.max' => 'العنوان يجب ألا يتجاوز 255 حرف',
            'message.required' => 'نص الإشعار مطلوب',
            'type.in' => 'نوع الإشعار غير صحيح',
        ];
    }
}
