<?php

declare(strict_types=1);

namespace App\Domains\Media\Services;

use App\Domains\Support\Services\FileUploadValidator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageService
{
    private ImageManager $imageManager;
    private FileUploadValidator $validator;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver());
        $this->validator = app(FileUploadValidator::class);
    }

    /**
     * Process and upload image to Cloudflare R2
     *
     * @param UploadedFile $file
     * @param string       $directory
     * @param string       $filename
     * @return string The file path in R2
     */
    public function processAndUpload(UploadedFile $file, string $directory, string $filename): string
    {
        // Validate image using secure file upload validator
        $this->validateImage($file);

        // Read and process image
        $image = $this->imageManager->read($file->getRealPath());

        // Resize to 300x300 maintaining aspect ratio
        $image->cover(300, 300);

        // Convert to WebP with 60% quality
        $webpImage = $image->toWebp(60);

        // Generate path
        $path = $directory . '/' . $filename . '.webp';

        // Upload to R2
        Storage::disk('r2')->put($path, (string) $webpImage);

        return $path;
    }

    /**
     * Delete image from R2
     *
     * @param string $path
     * @return bool
     */
    public function delete(string $path): bool
    {
        if (Storage::disk('r2')->exists($path)) {
            return Storage::disk('r2')->delete($path);
        }

        return true;
    }

    /**
     * Get public URL for image
     *
     * @param string $path
     * @return string
     */
    public function getUrl(string $path): string
    {
        $baseUrl = config('filesystems.disks.r2.url');

        if (!$baseUrl) {
            return '/' . ltrim($path, '/');
        }

        return rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
    }

    /**
     * Validate uploaded image using secure file upload validator
     *
     * @param UploadedFile $file
     * @throws \Exception
     */
    private function validateImage(UploadedFile $file): void
    {
        // Use the secure file upload validator for comprehensive validation
        $errors = $this->validator->validate($file, 'image');
        
        if (!empty($errors)) {
            throw new \Exception(implode(', ', $errors));
        }
    }

    /**
     * Generate unique filename
     *
     * @param string $prefix
     * @return string
     */
    public function generateFilename(string $prefix = ''): string
    {
        $timestamp = now()->timestamp;
        $random    = bin2hex(random_bytes(8));

        return $prefix ? "{$prefix}_{$timestamp}_{$random}" : "{$timestamp}_{$random}";
    }
}
