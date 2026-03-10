<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Student\Video;

use Illuminate\Foundation\Http\FormRequest;

class IssuePlaybackTokenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'device_fingerprint' => ['nullable', 'string', 'max:128'],
            'session_id' => ['nullable', 'string', 'max:128'],
        ];
    }
}
