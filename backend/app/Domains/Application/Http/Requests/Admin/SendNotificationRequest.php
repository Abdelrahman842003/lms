<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SendNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|min:3|max:255',
            'message' => 'required|string|min:5|max:1000',
            'recipient_type' => 'required|in:all_users,all_teachers,all_students,all_secretaries',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'عنوان الإخطار مطلوب',
            'title.min' => 'العنوان قصير جداً (3 أحرف على الأقل)',
            'title.max' => 'العنوان طويل جداً',
            'message.required' => 'نص الرسالة مطلوب',
            'message.min' => 'الرسالة قصيرة جداً (5 أحرف على الأقل)',
            'message.max' => 'الرسالة طويلة جداً',
            'recipient_type.required' => 'يجب اختيار المستقبلين',
            'recipient_type.in' => 'نوع المستقبلين غير صحيح',
        ];
    }
}
