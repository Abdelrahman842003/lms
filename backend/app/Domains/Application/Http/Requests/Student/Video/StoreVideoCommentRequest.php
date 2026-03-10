<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Student\Video;

use Illuminate\Foundation\Http\FormRequest;

class StoreVideoCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:4000'],
            'parent_id' => ['nullable', 'uuid'],
        ];
    }
}
