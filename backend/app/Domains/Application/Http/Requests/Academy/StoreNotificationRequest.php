<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $targetType = (string) $this->input('target_type');
        $academyId = (string) optional($this->user())->id;

        $targetIdRules = ['nullable', 'uuid'];

        if ($targetType === 'all') {
            $targetIdRules[] = 'prohibited';
        } elseif ($targetType === 'teachers') {
            $targetIdRules[] = Rule::exists('academy_teacher', 'teacher_id')
                ->where(static fn ($query) => $query->where('academy_id', $academyId));
        } elseif ($targetType === 'secretaries') {
            $targetIdRules[] = Rule::exists('academy_secretary', 'secretary_id')
                ->where(static fn ($query) => $query->where('academy_id', $academyId));
        }

        return [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|in:info,warning,success,danger',
            'target_type' => 'required|in:teachers,secretaries,all',
            'target_id' => $targetIdRules,
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
            'target_id.uuid' => 'معرف المستلم غير صالح',
            'target_id.exists' => 'المستلم المحدد غير تابع لهذه الأكاديمية',
            'target_id.prohibited' => 'لا يمكن تحديد مستلم محدد عند اختيار الجميع',
        ];
    }
}
