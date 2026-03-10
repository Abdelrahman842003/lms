<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Video;

use Illuminate\Foundation\Http\FormRequest;

class StoreVideoQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                          => 'required|string|max:255',
            'passing_score'                  => 'sometimes|integer|min:1|max:100',
            'is_required'                    => 'sometimes|boolean',
            'is_active'                      => 'sometimes|boolean',

            'questions'                      => 'required|array|min:1|max:50',
            'questions.*.text'               => 'required|string|max:1000',
            'questions.*.options'            => 'required|array|min:2|max:6',
            'questions.*.options.*'          => 'required|string|max:500',
            'questions.*.correct_answer'     => 'required|string|max:500',
            'questions.*.sort_order'         => 'sometimes|integer|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'                      => 'عنوان التدريب مطلوب',
            'passing_score.integer'               => 'نسبة النجاح يجب أن تكون رقماً صحيحاً',
            'passing_score.min'                   => 'نسبة النجاح لا تقل عن 1%',
            'passing_score.max'                   => 'نسبة النجاح لا تزيد عن 100%',
            'questions.required'                  => 'يجب إضافة سؤال واحد على الأقل',
            'questions.min'                       => 'يجب إضافة سؤال واحد على الأقل',
            'questions.max'                       => 'لا يمكن إضافة أكثر من 50 سؤالاً',
            'questions.*.text.required'           => 'نص السؤال مطلوب',
            'questions.*.options.required'        => 'خيارات السؤال مطلوبة',
            'questions.*.options.min'             => 'كل سؤال يجب أن يحتوي على خيارَين على الأقل',
            'questions.*.correct_answer.required' => 'الإجابة الصحيحة مطلوبة',
        ];
    }
}
