<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Support\Models\Setting;

class VideoSettingsService
{
    public function playbackTokenTtlSeconds(): int
    {
        return max(30, (int) Setting::getValue('video_playback_token_ttl_seconds', '120'));
    }

    public function maxConcurrentDevicesPerStudent(): int
    {
        return max(1, (int) Setting::getValue('video_max_concurrent_devices_per_student', '2'));
    }

    public function watermarkEnabled(): bool
    {
        return $this->toBool(Setting::getValue('video_watermark_enabled', '1'));
    }

    public function watermarkRotationIntervalSeconds(): int
    {
        return max(3, (int) Setting::getValue('video_watermark_rotation_interval_seconds', '8'));
    }

    public function reminderIntervalHours(): int
    {
        return max(1, (int) Setting::getValue('video_reminder_interval_hours', '12'));
    }

    public function reminderMaxAttempts(): int
    {
        return max(1, (int) Setting::getValue('video_reminder_max_attempts', '5'));
    }

    public function completedThresholdPercent(): int
    {
        return min(100, max(1, (int) Setting::getValue('video_completed_threshold_percent', '80')));
    }

    /**
     * @return array<int, string>
     */
    public function allowedVideoMimeTypes(): array
    {
        $default = [
            'video/mp4',
            'video/quicktime',
            'video/x-matroska',
            'video/webm',
        ];

        return $this->jsonArraySetting('video_allowed_video_mime_types', $default);
    }

    /**
     * @return array<int, string>
     */
    public function allowedAttachmentMimeTypes(): array
    {
        $default = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        return $this->jsonArraySetting('video_allowed_attachment_mime_types', $default);
    }

    public function targetHeight(): int
    {
        return 720;
    }

    public function videoMaxSizeMb(): int
    {
        return max(100, (int) Setting::getValue('video_max_upload_size_mb', '4096'));
    }

    public function attachmentMaxSizeMb(): int
    {
        return max(1, (int) Setting::getValue('video_attachment_max_size_mb', '25'));
    }

    public function notificationsEnabled(): bool
    {
        return $this->toBool(Setting::getValue('video_notifications_enabled', '1'));
    }

    // ──────────────────────────────────────────────────────────────
    // Direct-upload / Multipart settings
    // ──────────────────────────────────────────────────────────────

    public function directUploadEnabled(): bool
    {
        return $this->toBool(Setting::getValue('video_direct_upload_enabled', '1'));
    }

    public function chunkSizeMb(): int
    {
        return max(5, (int) Setting::getValue('video_chunk_size_mb', '10'));
    }

    public function maxConcurrentChunks(): int
    {
        return max(1, min(10, (int) Setting::getValue('video_max_concurrent_chunks', '3')));
    }

    public function presignedUrlTtlSeconds(): int
    {
        return max(300, (int) Setting::getValue('video_presigned_url_ttl_seconds', '3600'));
    }

    public function partRetryAttempts(): int
    {
        return max(1, (int) Setting::getValue('video_part_retry_attempts', '3'));
    }

    /** @return array<int, string> */
    public function allowedVideoExtensions(): array
    {
        return $this->jsonArraySetting(
            'video_allowed_video_extensions',
            ['mp4', 'mov', 'mkv', 'webm']
        );
    }

    private function toBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * @param array<int, string> $default
     * @return array<int, string>
     */
    private function jsonArraySetting(string $key, array $default): array
    {
        $raw = Setting::getValue($key, json_encode($default, JSON_UNESCAPED_UNICODE));
        if (! is_string($raw)) {
            return $default;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return $default;
        }

        return array_values(array_filter(array_map('strval', $decoded)));
    }
}
