<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Question;

use App\Domains\Exams\Enums\QuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreAcademyQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id' => ['required_without:teacher_profile_id', 'exists:teachers,id'],
            'teacher_profile_id' => ['required_without:teacher_id', 'exists:teacher_profiles,id'],
            'grade_id' => ['required', 'uuid', 'exists:grades,id'],
            'subject' => ['nullable', 'string', 'max:255'],
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

    public function prepareForValidation(): void
    {
        $this->merge(\App\Domains\Application\Traits\ResolvesTeacher::resolveTeacherInput($this));
    }
}
