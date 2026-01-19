<?php

declare(strict_types=1);

namespace App\Http\Requests\Academy\Lecture;

use Illuminate\Foundation\Http\FormRequest;

class StoreLectureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id' => ['required', 'uuid', 'exists:teachers,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'grade_id' => ['required', 'uuid', 'exists:grades,id'],
            'group_id' => ['nullable', 'uuid', 'exists:groups,id'],
            'date' => ['required_without:is_recurring', 'date'],
            'is_recurring' => ['boolean'],
            'recurrence_days' => ['required_if:is_recurring,true', 'array'],
            'recurrence_time' => ['required', 'date_format:H:i'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:480'],
        ];
    }

    public function messages(): array
    {
        return [
            'teacher_id.required' => 'المدرس مطلوب',
            'teacher_id.exists' => 'المدرس المختار غير موجود',
            'title.required' => 'عنوان المحاضرة مطلوب',
            'grade_id.required' => 'الصف الدراسي مطلوب',
            'grade_id.exists' => 'الصف الدراسي المختار غير موجود',
            'date.required_without' => 'تاريخ المحاضرة مطلوب في حالة عدم التكرار',
            'recurrence_days.required_if' => 'أيام التكرار مطلوبة في حالة التكرار',
            'recurrence_time.required' => 'وقت المحاضرة مطلوب',
            'duration_minutes.required' => 'مدة المحاضرة مطلوبة',
        ];
    }
}
