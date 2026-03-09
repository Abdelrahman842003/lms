<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Video;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVideoQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                          => 'sometimes|string|max:255',
            'passing_score'                  => 'sometimes|integer|min:1|max:100',
            'is_required'                    => 'sometimes|boolean',
            'is_active'                      => 'sometimes|boolean',

            'questions'                      => 'sometimes|array|min:1|max:50',
            'questions.*.text'               => 'required_with:questions|string|max:1000',
            'questions.*.options'            => 'required_with:questions|array|min:2|max:6',
            'questions.*.options.*'          => 'required|string|max:500',
            'questions.*.correct_answer'     => 'required_with:questions|string|max:500',
            'questions.*.sort_order'         => 'sometimes|integer|min:0',
        ];
    }
}
