<?php

declare(strict_types=1);

namespace App\Domains\Media\Adapters;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Adapter لـ Cloudflare R2 (متوافق مع S3 API).
 * يستخدم disk اسمه 'r2' محدود في filesystems.php.
 */
final class CloudflareR2Adapter implements StorageAdapter
{
    private string $disk;
    private string $publicUrl;

    public function __construct()
    {
        $this->disk      = 'r2';
        $this->publicUrl = rtrim(config('filesystems.disks.r2.url', ''), '/');
    }

    public function upload(UploadedFile $file, string $path): string
    {
        return $file->store($path, $this->disk);
    }

    public function delete(string $path): bool
    {
        return Storage::disk($this->disk)->delete($path);
    }

    public function url(string $path): string
    {
        // Cloudflare R2 Public URL
        if ($this->publicUrl) {
            return $this->publicUrl . '/' . ltrim($path, '/');
        }

        return Storage::disk($this->disk)->url($path);
    }

    public function exists(string $path): bool
    {
        return Storage::disk($this->disk)->exists($path);
    }
}
