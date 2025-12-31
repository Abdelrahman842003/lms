<?php

namespace App\Http\Requests\Teacher\Exam;

use Illuminate\Foundation\Http\FormRequest;

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
            'subject' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
            'date' => 'required|date',
            'duration' => 'required|integer|min:1',
            'total_marks' => 'required|integer|min:1',
            'actual_question_count' => 'required|integer|min:1',
            'time_per_question' => 'nullable|integer|min:10|max:600', // 10 seconds to 10 minutes
            'questions' => 'required|array|min:1',
            'questions.*.text' => 'required|string',
            'questions.*.options' => 'required|array|min:4|max:4',
            'questions.*.correct_answer' => 'required|string',
            'questions.*.duration' => 'required|integer|min:10|max:600',
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
            'questions.required' => 'الأسئلة مطلوبة',
            'questions.min' => 'يجب إضافة سؤال واحد على الأقل',
            'questions.*.text.required' => 'نص السؤال مطلوب',
            'questions.*.options.required' => 'خيارات السؤال مطلوبة',
            'questions.*.correct_answer.required' => 'الإجابة الصحيحة مطلوبة',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'title' => strip_tags($this->input('title')),
            'subject' => strip_tags($this->input('subject')),
        ]);
    }
}
