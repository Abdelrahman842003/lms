<?php

declare(strict_types=1);

namespace App\Http\Requests\Teacher\Notification;

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
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'recipient_type' => 'required|in:all,grade,group,admin',
            'grade_id' => 'required_if:recipient_type,grade|exists:grades,id',
            'group_id' => 'required_if:recipient_type,group|exists:groups,id',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'عنوان الإشعار مطلوب',
            'message.required' => 'نص الإشعار مطلوب',
            'recipient_type.required' => 'نوع المستلمين مطلوب',
            'recipient_type.in' => 'نوع المستلمين غير صحيح',
            'grade_id.required_if' => 'الصف الدراسي مطلوب',
            'grade_id.exists' => 'الصف الدراسي غير موجود',
            'group_id.required_if' => 'المجموعة مطلوبة',
            'group_id.exists' => 'المجموعة غير موجودة',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'title' => strip_tags($this->input('title')),
            'message' => strip_tags($this->input('message')),
        ]);
    }
}
