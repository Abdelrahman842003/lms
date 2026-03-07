<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Video;

use Illuminate\Foundation\Http\FormRequest;

class CompleteUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // ETags are fetched server-side via R2 ListParts — client only sends session_id
            'session_id' => ['required', 'uuid', 'exists:video_upload_sessions,id'],
        ];
    }
}
