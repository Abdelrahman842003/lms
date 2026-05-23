<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Lecture;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLectureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'grade_id' => 'sometimes|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
            'date' => 'nullable|date',
            'is_recurring' => 'boolean',
            'recurrence_days' => 'nullable|array',
            'recurrence_time' => 'nullable|date_format:H:i',
            'duration_minutes' => 'nullable|integer|min:1',
            'academy_id' => 'nullable|uuid|exists:academies,id',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'عنوان المحاضرة مطلوب',
            'grade_id.exists' => 'الصف الدراسي غير موجود',
            'group_id.exists' => 'المجموعة غير موجودة',
            'date.date' => 'تاريخ غير صحيح',
            'recurrence_time.date_format' => 'صيغة الوقت غير صحيحة',
            'duration_minutes.integer' => 'مدة المحاضرة يجب أن تكون رقماً صحيحاً',
        ];
    }
}
