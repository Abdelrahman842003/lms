<?php

namespace App\Domains\Application\Http\Controllers\Traits;

use App\Domains\Support\Services\FileUploadValidator;
use App\Domains\Application\Http\Responses\SecureFileResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

trait HandlesSecureFileUploads
{
    protected function uploadFile(
        UploadedFile $file,
        string $type,
        string $directory = 'uploads'
    ): string {
        $validator = app(FileUploadValidator::class);
        
        // Validate file
        $errors = $validator->validate($file, $type);
        if (!empty($errors)) {
            throw new \InvalidArgumentException(implode(', ', $errors));
        }
        
        // Generate safe filename
        $filename = $validator->generateSafeFilename($file);
        $path = "{$directory}/" . date('Y/m/d') . "/{$filename}";
        
        // Store file
        return Storage::disk('secure')->putFileAs(
            dirname($path),
            $file,
            basename($path)
        );
    }

    protected function serveSecureFile(string $path, ?string $disk = null)
    {
        return app(SecureFileResponse::class)->serve($path, $disk);
    }

    protected function streamSecureVideo(string $path, ?string $disk = null)
    {
        return app(SecureFileResponse::class)->streamVideo($path, $disk);
    }
}
