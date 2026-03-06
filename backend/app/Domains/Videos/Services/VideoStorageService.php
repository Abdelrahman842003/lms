<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Videos\Models\Video;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class VideoStorageService
{
    private string $disk = 'r2';

    public function uploadOriginal(Video $video, UploadedFile $file): string
    {
        $extension = strtolower((string) $file->getClientOriginalExtension()) ?: 'bin';
        $path = sprintf(
            'videos/originals/%s/%s.%s',
            $video->id,
            Str::uuid()->toString(),
            $extension,
        );

        Storage::disk($this->disk)->putFileAs(
            dirname($path),
            $file,
            basename($path),
            ['visibility' => 'private']
        );

        return $path;
    }

    public function uploadProcessedFile(Video $video, string $localFilePath): string
    {
        $path = sprintf('videos/processed/%s/master-720p.mp4', $video->id);

        $stream = fopen($localFilePath, 'rb');
        Storage::disk($this->disk)->put($path, $stream, ['visibility' => 'private', 'ContentType' => 'video/mp4']);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return $path;
    }

    public function uploadThumbnail(Video $video, string $localFilePath): string
    {
        $path = sprintf('videos/thumbnails/%s/poster.jpg', $video->id);

        $stream = fopen($localFilePath, 'rb');
        Storage::disk($this->disk)->put($path, $stream, ['visibility' => 'private', 'ContentType' => 'image/jpeg']);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return $path;
    }

    public function uploadAttachment(Video $video, UploadedFile $file): string
    {
        $safeName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $extension = strtolower((string) $file->getClientOriginalExtension()) ?: 'bin';
        $path = sprintf(
            'videos/attachments/%s/%s-%s.%s',
            $video->id,
            $safeName !== '' ? $safeName : 'attachment',
            Str::uuid()->toString(),
            $extension,
        );

        Storage::disk($this->disk)->putFileAs(
            dirname($path),
            $file,
            basename($path),
            ['visibility' => 'private']
        );

        return $path;
    }

    public function deleteIfExists(?string $path): void
    {
        if (! $path) {
            return;
        }

        $disk = Storage::disk($this->disk);
        if ($disk->exists($path)) {
            $disk->delete($path);
        }
    }

    public function exists(string $path): bool
    {
        return Storage::disk($this->disk)->exists($path);
    }

    public function readStream(string $path)
    {
        return Storage::disk($this->disk)->readStream($path);
    }

    public function size(string $path): int
    {
        return (int) Storage::disk($this->disk)->size($path);
    }

    public function mimeType(string $path): ?string
    {
        return Storage::disk($this->disk)->mimeType($path);
    }

    public function lastModified(string $path): int
    {
        return (int) Storage::disk($this->disk)->lastModified($path);
    }

    public function temporaryUrl(string $path, Carbon $expiresAt, array $options = []): string
    {
        return Storage::disk($this->disk)->temporaryUrl($path, $expiresAt, $options);
    }

    public function downloadToLocal(string $path, string $localPath): void
    {
        $stream = Storage::disk($this->disk)->readStream($path);
        $target = fopen($localPath, 'wb');

        if (! is_resource($stream) || ! is_resource($target)) {
            throw new \RuntimeException('تعذر قراءة الملف من التخزين.');
        }

        stream_copy_to_stream($stream, $target);
        fclose($stream);
        fclose($target);
    }
}
