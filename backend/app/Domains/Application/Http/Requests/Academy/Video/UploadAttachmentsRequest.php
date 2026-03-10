<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Video;

use App\Domains\Videos\Services\VideoSettingsService;
use Illuminate\Foundation\Http\FormRequest;

class UploadAttachmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var VideoSettingsService $settings */
        $settings = app(VideoSettingsService::class);

        $allowedMimes = implode(',', $settings->allowedAttachmentMimeTypes());
        $maxSizeKb    = $settings->attachmentMaxSizeMb() * 1024;

        return [
            'attachments'   => ['required', 'array', 'min:1', 'max:10'],
            'attachments.*' => [
                'required',
                'file',
                'mimetypes:' . $allowedMimes,
                'max:' . $maxSizeKb,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'attachments.required'    => 'يجب إرسال ملف مرفق واحد على الأقل.',
            'attachments.array'       => 'صيغة المرفقات غير صحيحة.',
            'attachments.min'         => 'يجب إرسال ملف مرفق واحد على الأقل.',
            'attachments.max'         => 'لا يمكن رفع أكثر من 10 مرفقات دفعة واحدة.',
            'attachments.*.required'  => 'الملف المرفق مطلوب.',
            'attachments.*.file'      => 'يجب أن يكون المرفق ملفاً صالحاً.',
            'attachments.*.mimes'     => 'نوع الملف غير مسموح به.',
            'attachments.*.max'       => 'حجم الملف يتجاوز الحد المسموح به.',
        ];
    }
}
