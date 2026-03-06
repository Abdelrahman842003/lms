<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Video;

use App\Domains\Videos\Services\VideoSettingsService;
use Illuminate\Foundation\Http\FormRequest;

class StoreVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $settings = app(VideoSettingsService::class);

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'grade_id' => ['required', 'exists:grades,id'],
            'group_ids' => ['nullable', 'array'],
            'group_ids.*' => ['exists:groups,id'],
            'lecture_id' => ['nullable', 'exists:lectures,id'],
            'lesson_id' => ['nullable', 'uuid'],
            'scheduled_at' => ['nullable', 'date'],
            'available_from' => ['nullable', 'date'],
            'available_until' => ['nullable', 'date', 'after_or_equal:available_from'],
            'video_file' => [
                'required',
                'file',
                'mimetypes:' . implode(',', $settings->allowedVideoMimeTypes()),
                'max:' . ($settings->videoMaxSizeMb() * 1024),
            ],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => [
                'file',
                'mimetypes:' . implode(',', $settings->allowedAttachmentMimeTypes()),
                'max:' . ($settings->attachmentMaxSizeMb() * 1024),
            ],
        ];
    }
}
