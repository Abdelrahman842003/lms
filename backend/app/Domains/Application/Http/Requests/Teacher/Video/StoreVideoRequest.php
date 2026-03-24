<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Video;

use App\Domains\Application\Http\Requests\BaseAuthorizedRequest;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Services\VideoSettingsService;

/**
 * Form request for storing a new video.
 *
 * BEFORE (Insecure):
 * public function authorize(): bool
 * {
 *     return true;  // ❌ No authorization check!
 * }
 *
 * AFTER (Secure):
 * Uses BaseAuthorizedRequest with policy-based authorization.
 * Requires 'create' ability on Video model.
 */
class StoreVideoRequest extends BaseAuthorizedRequest
{
    /**
     * The ability name for authorization.
     */
    protected string $ability = 'create';

    /**
     * The model class for policy checking.
     */
    protected string $modelClass = Video::class;

    /**
     * Whether to check against a specific model instance.
     * False for 'create' operations (no model instance exists yet).
     */
    protected bool $checkInstance = false;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
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
