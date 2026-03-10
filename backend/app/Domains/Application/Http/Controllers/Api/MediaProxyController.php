<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Api;

use App\Domains\Application\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaProxyController extends Controller
{
    /**
     * Stream a voice file from R2 storage.
     * Route is protected by auth:sanctum in api.php.
     */
    public function voice(Request $request, string $path): StreamedResponse
    {
        $path = $this->sanitizePath($path);

        if (!str_starts_with($path, 'voice_notifications/')) {
            $path = 'voice_notifications/' . $path;
        }

        return $this->streamFromR2($path);
    }

    /**
     * Stream any media file from R2 storage.
     * Route is protected by auth:sanctum in api.php.
     */
    public function media(Request $request, string $path): StreamedResponse
    {
        return $this->streamFromR2($this->sanitizePath($path));
    }

    /**
     * Prevent directory traversal attacks by sanitizing the path.
     */
    private function sanitizePath(string $path): string
    {
        // Resolve any ../ sequences
        $path = str_replace(['../', '..\\', "\0"], '', $path);
        // Strip leading slashes
        return ltrim($path, '/\\');
    }

    /**
     * Stream a file from R2 with proper headers.
     */
    private function streamFromR2(string $path): StreamedResponse
    {
        $disk = Storage::disk('r2');

        if (!$disk->exists($path)) {
            abort(404, 'File not found');
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk        = Storage::disk('r2');
        $mimeType    = method_exists($disk, 'mimeType') ? ($disk->mimeType($path) ?: 'application/octet-stream') : 'application/octet-stream';
        $size        = $disk->size($path);
        $lastModified = $disk->lastModified($path);

        return new StreamedResponse(function () use ($disk, $path) {
            $stream = $disk->readStream($path);
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type'                     => $mimeType,
            'Content-Length'                   => $size,
            'Last-Modified'                    => gmdate('D, d M Y H:i:s', $lastModified) . ' GMT',
            'Cache-Control'                    => 'private, max-age=3600',
            'Accept-Ranges'                    => 'bytes',
            'Access-Control-Allow-Origin'      => (string) config('app.url'),
            'Access-Control-Allow-Methods'     => 'GET, HEAD',
            'Access-Control-Allow-Credentials' => 'true',
        ]);
    }
}
