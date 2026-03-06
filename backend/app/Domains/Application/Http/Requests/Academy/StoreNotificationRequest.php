<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNotificationRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $targetId = $this->input('target_id');
        $targetIds = $this->input('target_ids', []);

        if (! is_array($targetIds)) {
            $targetIds = [];
        }

        if (is_string($targetId) && $targetId !== '' && ! in_array($targetId, $targetIds, true)) {
            $targetIds[] = $targetId;
        }

        $this->merge([
            'target_ids' => array_values(array_unique(array_filter($targetIds, static fn ($id) => is_string($id) && $id !== ''))),
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $targetType = (string) $this->input('target_type');
        $academyId = (string) optional($this->user())->id;

        $targetIdRules = ['nullable', 'uuid'];
        $targetIdsRules = ['nullable', 'array', 'max:200'];
        $targetIdsItemRules = ['uuid'];

        if ($targetType === 'all') {
            $targetIdRules[] = 'prohibited';
            $targetIdsRules[] = 'prohibited';
        } elseif ($targetType === 'teachers') {
            $targetIdRules[] = Rule::exists('academy_teacher', 'teacher_id')
                ->where(static fn ($query) => $query->where('academy_id', $academyId));

            $targetIdsItemRules[] = Rule::exists('academy_teacher', 'teacher_id')
                ->where(static fn ($query) => $query->where('academy_id', $academyId));
        } elseif ($targetType === 'secretaries') {
            $targetIdRules[] = Rule::exists('academy_secretary', 'secretary_id')
                ->where(static fn ($query) => $query->where('academy_id', $academyId));

            $targetIdsItemRules[] = Rule::exists('academy_secretary', 'secretary_id')
                ->where(static fn ($query) => $query->where('academy_id', $academyId));
        }

        return [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|in:info,warning,success,danger',
            'target_type' => 'required|in:teachers,secretaries,all',
            'target_id' => $targetIdRules,
            'target_ids' => $targetIdsRules,
            'target_ids.*' => $targetIdsItemRules,
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
            'target_ids.array' => 'صيغة المستلمين المحددين غير صحيحة',
            'target_ids.max' => 'عدد المستلمين المحددين كبير جدًا',
            'target_ids.prohibited' => 'لا يمكن تحديد مستلمين عند اختيار الجميع',
            'target_ids.*.uuid' => 'معرف أحد المستلمين غير صالح',
            'target_ids.*.exists' => 'أحد المستلمين المحددين غير تابع لهذه الأكاديمية',
        ];
    }
}
