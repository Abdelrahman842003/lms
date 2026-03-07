<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Video;

use App\Domains\Videos\Services\VideoSettingsService;
use Illuminate\Foundation\Http\FormRequest;

class InitiateUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $settings = app(VideoSettingsService::class);

        return [
            'title'                  => ['required', 'string', 'max:255'],
            'description'            => ['nullable', 'string'],
            'grade_id'               => ['required', 'exists:grades,id'],
            'group_ids'              => ['nullable', 'array'],
            'group_ids.*'            => ['exists:groups,id'],
            'lecture_id'             => ['nullable', 'exists:lectures,id'],
            'lesson_id'              => ['nullable', 'uuid'],
            'scheduled_at'           => ['nullable', 'date'],
            'available_from'         => ['nullable', 'date'],
            'available_until'        => ['nullable', 'date', 'after_or_equal:available_from'],
            'teacher_reference_id'   => ['nullable', 'exists:teachers,id'],
            'teacher_reference_name' => ['nullable', 'string', 'max:255'],

            'file_name'   => ['required', 'string', 'max:512'],
            'file_size'   => ['required', 'integer', 'min:1'],
            'file_mime'   => [
                'required',
                'string',
                'in:' . implode(',', $settings->allowedVideoMimeTypes()),
            ],
            'total_parts' => ['required', 'integer', 'min:1', 'max:10000'],
        ];
    }

    public function messages(): array
    {
        return [
            'file_mime.in' => 'نوع الملف غير مدعوم.',
        ];
    }
}
