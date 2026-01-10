<?php

declare(strict_types=1);

namespace App\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotificationRequest extends FormRequest
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
            'type' => 'required|in:info,warning,success,danger',
            'target_type' => 'required|in:teachers,secretaries,all',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'العنوان مطلوب',
            'title.max' => 'العنوان يجب ألا يتجاوز 255 حرف',
            'message.required' => 'نص الإشعار مطلوب',
            'type.required' => 'نوع الإشعار مطلوب',
            'type.in' => 'نوع الإشعار غير صحيح',
            'target_type.required' => 'الفئة المستهدفة مطلوبة',
            'target_type.in' => 'الفئة المستهدفة غير صحيحة',
        ];
    }
}
