<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Lecture;

use Illuminate\Foundation\Http\FormRequest;

class StoreLectureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by ResolvesTeacher trait
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'grade_id' => 'required|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
            'date' => 'nullable|date|required_without:is_recurring',
            'is_recurring' => 'boolean',
            'recurrence_days' => 'nullable|array|required_if:is_recurring,true',
            'recurrence_days.*' => 'string|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'recurrence_time' => 'nullable|date_format:H:i|required_if:is_recurring,true',
            'duration_minutes' => 'nullable|integer|min:1|required_if:is_recurring,true',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'عنوان المحاضرة مطلوب',
            'title.max' => 'عنوان المحاضرة يجب ألا يتجاوز 255 حرف',
            'grade_id.required' => 'يجب اختيار الصف الدراسي',
            'grade_id.exists' => 'الصف الدراسي غير موجود',
            'group_id.exists' => 'المجموعة غير موجودة',
            'date.required_without' => 'يجب تحديد التاريخ للمحاضرات غير المتكررة',
            'date.date' => 'صيغة التاريخ غير صحيحة',
            'recurrence_days.required_if' => 'يجب تحديد أيام التكرار للمحاضرات المتكررة',
            'recurrence_time.required_if' => 'يجب تحديد وقت المحاضرة للمحاضرات المتكررة',
            'recurrence_time.date_format' => 'صيغة الوقت غير صحيحة (يجب أن تكون HH:MM)',
            'duration_minutes.required_if' => 'يجب تحديد مدة المحاضرة للمحاضرات المتكررة',
            'duration_minutes.min' => 'مدة المحاضرة يجب أن تكون دقيقة واحدة على الأقل',
        ];
    }
}
