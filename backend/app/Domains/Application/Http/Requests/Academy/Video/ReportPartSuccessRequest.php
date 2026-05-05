<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Video;

use Illuminate\Foundation\Http\FormRequest;

class ReportPartSuccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'session_id'  => ['required', 'uuid', 'exists:video_upload_sessions,id'],
            'part_number' => ['required', 'integer', 'min:1'],
            'etag'        => ['required', 'string'],
        ];
    }
}
