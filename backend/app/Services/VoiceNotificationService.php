<?php

namespace App\Services;

use App\Models\DailyVoiceLimit;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VoiceNotificationService
{
    /**
     * Maximum allowed duration in seconds
     */
    public const MAX_DURATION = 40;

    /**
     * Maximum file size in bytes (2MB - safe for 90 sec high quality audio)
     */
    public const MAX_FILE_SIZE = 2097152;

    /**
     * Allowed MIME types (base types, without codec specification)
     */
    public const ALLOWED_MIMES = [
        'audio/webm',
        'audio/ogg',
        'audio/opus',
        'audio/mp4',
        'audio/mpeg',
        'audio/mp3',
        'audio/x-m4a',
        'video/webm', // Some browsers report WebM audio as video/webm
        'application/octet-stream', // Fallback for some browsers
    ];

    /**
     * Check if user can send a voice notification
     */
    public function canUserSendVoice($user): bool
    {
        return DailyVoiceLimit::canSendVoice($user);
    }

    /**
     * Validate audio file
     * 
     * @throws \InvalidArgumentException
     */
    public function validateAudioFile(UploadedFile $file, int $duration): void
    {
        // Check file size
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException(
                'حجم الملف كبير جداً. الحد الأقصى ' . (self::MAX_FILE_SIZE / 1024) . ' KB'
            );
        }

        // Check MIME type - handle codecs in mime type like "audio/webm; codecs=opus"
        $mimeType = $file->getMimeType();
        $baseMimeType = explode(';', $mimeType)[0]; // Remove codec specification
        $baseMimeType = trim($baseMimeType);
        
        // Also check client mime type as fallback
        $clientMimeType = $file->getClientMimeType();
        $baseClientMimeType = explode(';', $clientMimeType ?? '')[0];
        $baseClientMimeType = trim($baseClientMimeType);
        
        $isValidMime = in_array($baseMimeType, self::ALLOWED_MIMES) || 
                       in_array($baseClientMimeType, self::ALLOWED_MIMES);
        
        if (!$isValidMime) {
            throw new \InvalidArgumentException(
                'صيغة الملف غير مدعومة. الصيغ المدعومة: WebM, OGG, Opus, MP4, MP3'
            );
        }

        // Check duration
        if ($duration > self::MAX_DURATION) {
            throw new \InvalidArgumentException(
                'مدة التسجيل تتجاوز الحد الأقصى (' . self::MAX_DURATION . ' ثانية)'
            );
        }

        if ($duration < 1) {
            throw new \InvalidArgumentException('مدة التسجيل قصيرة جداً');
        }
    }

    /**
     * Store voice file and return the path
     */
    /**
     * Store voice file and return the path
     */
    public function storeVoiceFile(UploadedFile $file, $user): string
    {
        $year = now()->format('Y');
        $month = now()->format('m');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        
        $path = "voice_notifications/{$year}/{$month}/{$filename}";
        
        Storage::disk('r2')->put($path, file_get_contents($file->getRealPath()));
        
        return $path;
    }

    /**
     * Delete a voice file
     */
    public function deleteVoiceFile(string $path): bool
    {
        if (Storage::disk('r2')->exists($path)) {
            return Storage::disk('r2')->delete($path);
        }
        return false;
    }

    /**
     * Get the public URL for a voice file
     */
    public function getVoiceUrl(string $path): string
    {
        return Storage::disk('r2')->url($path);
    }

    /**
     * Mark user as having used their daily voice limit
     */
    public function markDailyLimitUsed($user): void
    {
        DailyVoiceLimit::markAsUsed($user);
    }
}
