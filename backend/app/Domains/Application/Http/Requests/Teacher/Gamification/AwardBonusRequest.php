<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Gamification;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AwardBonusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', Rule::exists('students', 'id')],
            'points' => 'required|integer|min:1|max:1000',
            'description' => 'required|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => 'معرف الطالب مطلوب',
            'student_id.uuid' => 'معرف الطالب غير صحيح',
            'student_id.exists' => 'الطالب غير موجود',
            'points.required' => 'النقاط مطلوبة',
            'points.integer' => 'النقاط يجب أن تكون رقماً صحيحاً',
            'points.min' => 'النقاط يجب أن تكون 1 على الأقل',
            'points.max' => 'النقاط لا يمكن أن تزيد عن 1000',
            'description.required' => 'الوصف مطلوب',
            'description.string' => 'الوصف يجب أن يكون نصاً',
            'description.max' => 'الوصف لا يمكن أن يزيد عن 255 حرفاً',
        ];
    }
}
