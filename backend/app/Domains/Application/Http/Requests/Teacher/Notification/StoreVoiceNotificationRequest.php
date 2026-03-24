<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Notification;

use App\Domains\Notifications\Services\VoiceNotificationService;
use App\Domains\Support\Rules\SecureFileUpload;
use Illuminate\Foundation\Http\FormRequest;

class StoreVoiceNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'voice' => ['required', 'file', new SecureFileUpload('audio')],
            'duration' => 'required|integer|min:1|max:' . VoiceNotificationService::MAX_DURATION,
            'recipient_type' => 'required|in:all,grade,group,admin',
            'grade_id' => 'required_if:recipient_type,grade|exists:grades,id',
            'group_id' => 'required_if:recipient_type,group|exists:groups,id',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'عنوان الرسالة الصوتية مطلوب',
            'voice.required' => 'ملف الصوت مطلوب',
            'voice.max' => 'حجم الملف يجب ألا يتجاوز 2 ميجابايت',
            'duration.required' => 'مدة التسجيل مطلوبة',
            'duration.max' => 'مدة التسجيل يجب ألا تتجاوز ' . VoiceNotificationService::MAX_DURATION . ' ثانية',
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
        ]);
    }
}
