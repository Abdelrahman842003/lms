<?php

declare(strict_types=1);

namespace App\Domains\Application\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\File\Exception\UploadException;

class FileUploadValidator
{
    protected array $allowedMimeTypes = [
        'video' => [
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/webm',
        ],
        'image' => [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ],
        'document' => [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        'audio' => [
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'audio/webm',
        ],
    ];

    protected array $allowedExtensions = [
        'video' => ['mp4', 'mov', 'avi', 'webm'],
        'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'document' => ['pdf', 'doc', 'docx'],
        'audio' => ['mp3', 'wav', 'ogg', 'weba'],
    ];

    protected array $maxFileSizes = [
        'video' => 102400, // 100MB in KB
        'image' => 10240,  // 10MB in KB
        'document' => 20480, // 20MB in KB
        'audio' => 51200,  // 50MB in KB
    ];

    /**
     * Validate an uploaded file
     */
    public function validate(UploadedFile $file, string $type): array
    {
        $errors = [];

        // Check MIME type
        if (!$this->isValidMimeType($file, $type)) {
            $errors[] = "Invalid file type. Allowed types: " . implode(', ', $this->allowedExtensions[$type] ?? []);
        }

        // Check extension
        if (!$this->isValidExtension($file, $type)) {
            $errors[] = "Invalid file extension.";
        }

        // Check file size
        if (!$this->isValidSize($file, $type)) {
            $maxSize = $this->maxFileSizes[$type] ?? 10240;
            $errors[] = "File too large. Maximum size: " . ($maxSize / 1024) . "MB";
        }

        // Check for extension spoofing
        if ($this->isExtensionSpoofed($file)) {
            $errors[] = "File extension does not match content.";
        }

        // Check for malicious content
        if ($this->containsMaliciousContent($file)) {
            $errors[] = "File contains potentially malicious content.";
        }

        return $errors;
    }

    /**
     * Check if the file passes all validation
     */
    public function isValid(UploadedFile $file, string $type): bool
    {
        return empty($this->validate($file, $type));
    }

    protected function isValidMimeType(UploadedFile $file, string $type): bool
    {
        $allowed = $this->allowedMimeTypes[$type] ?? [];
        $mimeType = $file->getMimeType();
        
        return in_array($mimeType, $allowed);
    }

    protected function isValidExtension(UploadedFile $file, string $type): bool
    {
        $allowed = $this->allowedExtensions[$type] ?? [];
        $extension = strtolower($file->getClientOriginalExtension() ?? '');
        
        if (empty($extension)) {
            return false;
        }
        
        return in_array($extension, $allowed);
    }

    protected function isValidSize(UploadedFile $file, string $type): bool
    {
        $maxSize = $this->maxFileSizes[$type] ?? 10240;
        $sizeInKb = $file->getSize() / 1024;
        
        return $sizeInKb <= $maxSize;
    }

    /**
     * Detect extension spoofing by checking actual content
     */
    protected function isExtensionSpoofed(UploadedFile $file): bool
    {
        $extension = strtolower($file->getClientOriginalExtension() ?? '');
        
        if (empty($extension)) {
            return false;
        }
        
        $mimeType = $file->getMimeType();
        
        // Map extensions to expected MIME types
        $extensionMimeMap = [
            // Images
            'jpg' => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
            'png' => ['image/png'],
            'gif' => ['image/gif'],
            'webp' => ['image/webp'],
            // Videos
            'mp4' => ['video/mp4'],
            'mov' => ['video/quicktime'],
            'avi' => ['video/x-msvideo'],
            'webm' => ['video/webm'],
            // Audio
            'mp3' => ['audio/mpeg'],
            'wav' => ['audio/wav'],
            'ogg' => ['audio/ogg'],
            'weba' => ['audio/webm'],
            // Documents
            'pdf' => ['application/pdf'],
            'doc' => ['application/msword'],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ];
        
        if (!isset($extensionMimeMap[$extension])) {
            return false;
        }
        
        return !in_array($mimeType, $extensionMimeMap[$extension]);
    }

    /**
     * Check for malicious content in file
     */
    protected function containsMaliciousContent(UploadedFile $file): bool
    {
        $mimeType = $file->getMimeType() ?? '';

        // Skip deep text-pattern scanning for trusted binary formats.
        // Regex scanning binary payloads can produce false positives.
        $trustedBinaryMimePrefixes = ['image/', 'video/', 'audio/'];
        foreach ($trustedBinaryMimePrefixes as $prefix) {
            if (str_starts_with($mimeType, $prefix)) {
                return false;
            }
        }

        $trustedBinaryMimes = [
            'application/pdf',
        ];

        if (in_array($mimeType, $trustedBinaryMimes, true)) {
            return false;
        }

        $handle = @fopen($file->getPathname(), 'r');
        if ($handle === false) {
            return true;
        }

        $content = fread($handle, 32768) ?: '';
        fclose($handle);
        
        $maliciousPatterns = [
            '/<\?php/i',
            '/<\?=/i',
            '/<script/i',
            '/javascript:/i',
            '/on\w+\s*=/i',
            '/<%/i',
            '/\%\>/i',
            '/<svg/i',
            '/<use\s/i',
            '/&#x?\d+;/i',
            '/data:/i',
        ];
        
        foreach ($maliciousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Generate a safe filename
     */
    public function generateSafeFilename(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $basename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        
        // Sanitize basename
        $basename = preg_replace('/[^a-zA-Z0-9_-]/', '', $basename);
        $basename = substr($basename, 0, 50);
        
        // Add random suffix to prevent overwrites
        $suffix = bin2hex(random_bytes(8));
        
        return "{$basename}_{$suffix}.{$extension}";
    }

    /**
     * Get validation rules for a file type
     */
    public function getValidationRules(string $type): array
    {
        $mimes = implode(',', $this->allowedExtensions[$type] ?? []);
        $maxSize = $this->maxFileSizes[$type] ?? 10240;
        
        return [
            'required',
            'file',
            "mimes:{$mimes}",
            "max:{$maxSize}",
        ];
    }
}
