<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Exam;

use App\Domains\Exams\Enums\QuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'type' => 'nullable|string|in:manual,dynamic,self_test',
            'dynamic_settings' => 'nullable|array',
            'subject' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
            'date' => 'required|date',
            'duration' => 'required|integer|min:1',
            'total_marks' => 'required|integer|min:1',
            'actual_question_count' => 'required|integer|min:1',
            'time_per_question' => 'nullable|integer|min:10|max:600', // 10 seconds to 10 minutes
            // For manual exams, we must have at least one question
            'questions' => [
                'required_if:type,manual',
                'array',
                $this->type === 'manual' ? 'min:1' : 'nullable',
            ],
            'questions.*.text' => 'nullable|string',
            'questions.*.type' => ['nullable', new Enum(QuestionType::class)],
            'questions.*.options' => 'nullable|array|min:2',
            'questions.*.correct_answer' => 'nullable|string',
            'questions.*.duration' => 'nullable|integer|min:10|max:600',
            'questions.*.difficulty' => 'nullable|string|in:easy,medium,hard',
            'question_ids' => 'nullable|array',
            'question_ids.*' => 'exists:questions,id',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'عنوان الامتحان مطلوب',
            'subject.required' => 'المادة مطلوبة',
            'grade_id.required' => 'الصف الدراسي مطلوب',
            'grade_id.exists' => 'الصف الدراسي غير موجود',
            'date.required' => 'تاريخ الامتحان مطلوب',
            'date.date' => 'تاريخ الامتحان غير صحيح',
            'duration.required' => 'مدة الامتحان مطلوبة',
            'duration.min' => 'مدة الامتحان يجب أن تكون دقيقة واحدة على الأقل',
            'total_marks.required' => 'الدرجة الكلية مطلوبة',
            'total_marks.min' => 'الدرجة الكلية يجب أن تكون 1 على الأقل',
            'actual_question_count.required' => 'عدد الأسئلة الفعلية مطلوب',
            'actual_question_count.min' => 'عدد الأسئلة يجب أن يكون 1 على الأقل',
            'time_per_question.required' => 'مدة كل سؤال مطلوبة',
            'time_per_question.min' => 'مدة السؤال يجب أن تكون 10 ثوانٍ على الأقل',
            'time_per_question.max' => 'مدة السؤال يجب ألا تتجاوز 10 دقائق',
            'questions.required_if' => 'الأسئلة مطلوبة في حالة الامتحان اليدوي',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'title' => clean_input($this->input('title')),
            'subject' => clean_input($this->input('subject')),
        ]);
    }
}
