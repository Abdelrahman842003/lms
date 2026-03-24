<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Responses;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SecureFileResponse
{
    protected array $disallowedExtensions = [
        'php', 'php3', 'php4', 'php5', 'phtml',
        'exe', 'bat', 'cmd', 'sh', 'bash',
        'js', 'html', 'htm', 'svg',
    ];

    protected function validatePath(string $path): string
    {
        $path = str_replace(['../', '..\\', '..'], '', $path);
        $path = str_replace(chr(0), '', $path);
        $path = ltrim($path, '/\\');
        
        if (str_contains($path, '..') || str_contains($path, "\0")) {
            abort(403, 'Invalid file path');
        }
        
        return $path;
    }

    /**
     * Serve a file securely with proper headers
     */
    public function serve(string $path, ?string $disk = null): Response
    {
        $path = $this->validatePath($path);
        $disk = $disk ?? config('filesystems.default');
        
        if (!Storage::disk($disk)->exists($path)) {
            abort(404, 'File not found');
        }
        
        // Get file extension
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        
        // Block dangerous extensions
        if (in_array($extension, $this->disallowedExtensions)) {
            abort(403, 'File type not allowed');
        }
        
        // Get MIME type
        $mimeType = Storage::disk($disk)->mimeType($path);
        
        // Force download for potentially dangerous types
        $forceDownload = in_array($extension, ['pdf', 'doc', 'docx']);
        
        $headers = [
            'Content-Type' => $mimeType,
            'Content-Disposition' => $forceDownload 
                ? 'attachment; filename="' . basename($path) . '"'
                : 'inline; filename="' . basename($path) . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, max-age=3600',
        ];
        
        return Storage::disk($disk)->response($path, null, $headers);
    }

    /**
     * Stream a video file with range support
     */
    public function streamVideo(string $path, ?string $disk = null): StreamedResponse
    {
        $path = $this->validatePath($path);
        $disk = $disk ?? config('filesystems.default');
        
        if (!Storage::disk($disk)->exists($path)) {
            abort(404, 'Video not found');
        }
        
        $mimeType = Storage::disk($disk)->mimeType($path);
        $fileSize = Storage::disk($disk)->size($path);
        
        return response()->stream(function () use ($path, $disk) {
            $stream = Storage::disk($disk)->readStream($path);
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => $fileSize,
            'Accept-Ranges' => 'bytes',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
