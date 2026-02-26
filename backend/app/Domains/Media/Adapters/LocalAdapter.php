<?php

declare(strict_types=1);

namespace App\Domains\Media\Adapters;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Adapter للتخزين المحلي (public disk).
 */
final class LocalAdapter implements StorageAdapter
{
    private string $disk;

    public function __construct(string $disk = 'public')
    {
        $this->disk = $disk;
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
        return Storage::disk($this->disk)->url($path);
    }

    public function exists(string $path): bool
    {
        return Storage::disk($this->disk)->exists($path);
    }
}
