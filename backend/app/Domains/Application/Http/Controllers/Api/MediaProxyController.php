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
     * Stream a voice file from R2 storage
     */
    public function voice(Request $request, string $path)
    {
        // Prepend the voice_notifications directory if not present
        if (!str_starts_with($path, 'voice_notifications/')) {
            $path = 'voice_notifications/' . $path;
        }

        return $this->streamFromR2($path);
    }

    /**
     * Stream any media file from R2 storage
     */
    public function media(Request $request, string $path)
    {
        return $this->streamFromR2($path);
    }

    /**
     * Stream a file from R2 with proper headers
     */
    private function streamFromR2(string $path): StreamedResponse
    {
        $disk = Storage::disk('r2');

        if (!$disk->exists($path)) {
            abort(404, 'File not found');
        }

        $mimeType = $disk->mimeType($path) ?: 'application/octet-stream';
        $size = $disk->size($path);
        $lastModified = $disk->lastModified($path);

        return new StreamedResponse(function () use ($disk, $path) {
            $stream = $disk->readStream($path);
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => $size,
            'Last-Modified' => gmdate('D, d M Y H:i:s', $lastModified) . ' GMT',
            'Cache-Control' => 'public, max-age=31536000', // Cache for 1 year
            'Accept-Ranges' => 'bytes',
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Range',
            'Access-Control-Expose-Headers' => 'Content-Length, Content-Range',
        ]);
    }
}
