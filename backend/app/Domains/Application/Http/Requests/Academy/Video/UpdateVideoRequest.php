<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Video;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                  => ['sometimes', 'required', 'string', 'max:255'],
            'description'            => ['sometimes', 'nullable', 'string'],
            'teacher_reference_id'   => ['sometimes', 'nullable', 'exists:teachers,id'],
            'teacher_reference_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'grade_id'               => ['sometimes', 'required', 'exists:grades,id'],
            'group_ids'              => ['sometimes', 'array'],
            'group_ids.*'            => ['exists:groups,id'],
            'lecture_id'             => ['sometimes', 'nullable', 'exists:lectures,id'],
            'lesson_id'              => ['sometimes', 'nullable', 'uuid'],
            'scheduled_at'           => ['sometimes', 'nullable', 'date'],
            'available_from'         => ['sometimes', 'nullable', 'date'],
            'available_until'        => ['sometimes', 'nullable', 'date', 'after_or_equal:available_from'],

            // ─── التدريب (اختياري - null يعني احذف التدريب) ────────────
            'quiz'                              => ['sometimes', 'nullable', 'array'],
            'quiz.title'                        => ['required_with:quiz', 'string', 'max:255'],
            'quiz.passing_score'                => ['sometimes', 'integer', 'min:1', 'max:100'],
            'quiz.is_required'                  => ['sometimes', 'boolean'],
            'quiz.is_active'                    => ['sometimes', 'boolean'],
            'quiz.questions'                    => ['required_with:quiz', 'array', 'min:1', 'max:50'],
            'quiz.questions.*.text'             => ['required', 'string', 'max:1000'],
            'quiz.questions.*.options'          => ['required', 'array', 'min:2', 'max:6'],
            'quiz.questions.*.options.*'        => ['required', 'string', 'max:500'],
            'quiz.questions.*.correct_answer'   => ['required', 'string', 'max:500'],
            'quiz.questions.*.sort_order'       => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'quiz.title.required_with'              => 'عنوان التدريب مطلوب',
            'quiz.questions.required_with'          => 'يجب إضافة سؤال واحد على الأقل',
            'quiz.questions.min'                    => 'يجب إضافة سؤال واحد على الأقل',
            'quiz.questions.max'                    => 'لا يمكن إضافة أكثر من 50 سؤالاً',
            'quiz.questions.*.text.required'        => 'نص السؤال مطلوب',
            'quiz.questions.*.options.required'     => 'خيارات السؤال مطلوبة',
            'quiz.questions.*.options.min'          => 'كل سؤال يجب أن يحتوي على خيارَين على الأقل',
            'quiz.questions.*.correct_answer.required' => 'الإجابة الصحيحة مطلوبة',
        ];
    }
}
