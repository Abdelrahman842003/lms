<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Application\Models\Setting;
use Illuminate\Database\Seeder;

class VideoSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // Playback & Security
            ['key' => 'video_playback_token_ttl_seconds', 'value' => '300', 'group' => 'video'],
            ['key' => 'video_max_concurrent_devices_per_student', 'value' => '2', 'group' => 'video'],
            ['key' => 'video_watermark_enabled', 'value' => '1', 'group' => 'video'],
            ['key' => 'video_watermark_rotation_interval_seconds', 'value' => '8', 'group' => 'video'],
            
            // Tracking & Reminders
            ['key' => 'video_reminder_interval_hours', 'value' => '12', 'group' => 'video'],
            ['key' => 'video_reminder_max_attempts', 'value' => '5', 'group' => 'video'],
            ['key' => 'video_completed_threshold_percent', 'value' => '85', 'group' => 'video'],
            ['key' => 'video_notifications_enabled', 'value' => '1', 'group' => 'video'],
            
            // Allowed Types
            ['key' => 'video_allowed_video_mime_types', 'value' => json_encode(['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm']), 'group' => 'video'],
            ['key' => 'video_allowed_attachment_mime_types', 'value' => json_encode(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']), 'group' => 'video'],
            ['key' => 'video_allowed_video_extensions', 'value' => json_encode(['mp4', 'mov', 'mkv', 'webm']), 'group' => 'video'],
            
            // Upload Limits
            ['key' => 'video_max_upload_size_mb', 'value' => '5120', 'group' => 'video'], // 5GB
            ['key' => 'video_attachment_max_size_mb', 'value' => '50', 'group' => 'video'],
            
            // Direct Upload (R2 Optimization)
            ['key' => 'video_direct_upload_enabled', 'value' => '1', 'group' => 'video'],
            ['key' => 'video_chunk_size_mb', 'value' => '10', 'group' => 'video'],
            ['key' => 'video_max_concurrent_chunks', 'value' => '3', 'group' => 'video'],
            ['key' => 'video_presigned_url_ttl_seconds', 'value' => '3600', 'group' => 'video'],
            ['key' => 'video_part_retry_attempts', 'value' => '3', 'group' => 'video'],
            
            // Advanced Production Features
            ['key' => 'video_hls_enabled', 'value' => '1', 'group' => 'video'],
            ['key' => 'video_streaming_enabled', 'value' => '1', 'group' => 'video'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        $this->command->info('Video settings seeded with production-ready values.');
    }
}
