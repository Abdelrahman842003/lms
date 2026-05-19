<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Question;

use App\Domains\Exams\Enums\QuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateAcademyQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id' => ['sometimes', 'uuid', 'exists:teachers,id'],
            'grade_id' => ['sometimes', 'uuid', 'exists:grades,id'],
            'subject' => ['sometimes', 'string', 'max:255'],
            'text' => ['sometimes', 'string'],
            'type' => ['sometimes', new Enum(QuestionType::class)],
            'difficulty' => ['sometimes', 'string', 'in:easy,medium,hard'],
            'options' => ['sometimes', 'array', 'min:2'],
            'correct_answer' => ['sometimes', 'string'],
            'duration' => ['sometimes', 'integer', 'min:10'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
        ];
    }
}
