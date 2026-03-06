<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Student\Video;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWatchProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'watched_seconds' => ['required', 'integer', 'min:0'],
            'last_position_seconds' => ['required', 'integer', 'min:0'],
            'playback_token_id' => ['nullable', 'uuid'],
        ];
    }
}
