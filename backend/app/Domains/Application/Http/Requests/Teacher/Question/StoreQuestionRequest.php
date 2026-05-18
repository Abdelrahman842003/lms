<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Question;

use App\Domains\Exams\Enums\QuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => ['required', 'string'],
            'type' => ['required', new Enum(QuestionType::class)],
            'difficulty' => ['required', 'string', 'in:easy,medium,hard'],
            'options' => ['required', 'array', 'min:2'],
            'correct_answer' => ['required', 'string'],
            'duration' => ['required', 'integer', 'min:10'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
        ];
    }
}
