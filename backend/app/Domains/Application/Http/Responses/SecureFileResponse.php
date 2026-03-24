<?php

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

    /**
     * Serve a file securely with proper headers
     */
    public function serve(string $path, ?string $disk = null): Response
    {
        $disk = $disk ?? config('filesystems.default');
        
        // Check if file exists
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
