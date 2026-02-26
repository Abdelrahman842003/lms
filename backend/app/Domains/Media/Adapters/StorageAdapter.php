<?php

declare(strict_types=1);

namespace App\Domains\Media\Adapters;

use Illuminate\Http\UploadedFile;

/**
 * Contract للتعامل مع تخزين الميديا.
 * يدعم Adapter Pattern: Local / S3 / Cloudflare R2.
 */
interface StorageAdapter
{
    /**
     * رفع ملف وإعادة المسار النسبي المخزّن.
     */
    public function upload(UploadedFile $file, string $path): string;

    /**
     * حذف ملف بمساره.
     */
    public function delete(string $path): bool;

    /**
     * الحصول على URL عام للملف.
     */
    public function url(string $path): string;

    /**
     * هل الملف موجود؟
     */
    public function exists(string $path): bool;
}
