<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class SubmitVideoQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // مصفوفة ['question_id' => 'answer']
            'answers'   => 'required|array|min:1',
            'answers.*' => 'required|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'answers.required' => 'يجب إرسال إجابات الأسئلة',
            'answers.min'      => 'يجب إرسال إجابة واحدة على الأقل',
        ];
    }
}
