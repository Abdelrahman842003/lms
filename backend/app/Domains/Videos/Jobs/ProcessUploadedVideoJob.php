<?php

declare(strict_types=1);

namespace App\Domains\Videos\Jobs;

use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Services\VideoLifecycleService;
use App\Domains\Videos\Services\VideoProcessingService;
use App\Domains\Videos\Services\VideoStorageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessUploadedVideoJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 7200;

    public int $tries = 3;

    public function __construct(
        public readonly string $videoId,
    ) {}

    public function handle(
        VideoLifecycleService $lifecycle,
        VideoProcessingService $processing,
        VideoStorageService $storage,
    ): void {
        $video = Video::query()->find($this->videoId);
        if (! $video) {
            return;
        }

        // Already successfully processed — skip silently (handles duplicate/retry dispatches).
        if ($video->status === VideoStatus::READY ||
            $video->processing_status === VideoProcessingStatus::SUCCEEDED) {
            return;
        }

        if (! $video->original_path) {
            $lifecycle->markFailed($video, 'لم يتم العثور على الملف الأصلي للفيديو.');
            return;
        }

        $tempDir = storage_path('app/tmp/videos/' . $video->id);
        if (!is_dir($tempDir) && !mkdir($tempDir, 0775, true) && !is_dir($tempDir)) {
            $lifecycle->markFailed($video, 'فشل إنشاء المجلد المؤقت للمعالجة.');
            return;
        }

        $inputPath = $tempDir . '/input';
        $outputPath = $tempDir . '/output-720p.mp4';
        $thumbnailPath = $tempDir . '/thumbnail.jpg';

        try {
            $lifecycle->markProcessing($video);
            $processing->ensureBinaryAvailable();

            $storage->downloadToLocal($video->original_path, $inputPath);
            $processing->transcodeTo720p($inputPath, $outputPath);
            $processing->generateThumbnail($outputPath, $thumbnailPath);

            $metadata = $processing->extractMetadata($outputPath);

            $processedPath = $storage->uploadProcessedFile($video, $outputPath);
            $thumbPath = $storage->uploadThumbnail($video, $thumbnailPath);

            $lifecycle->markProcessed($video, [
                'processed_path' => $processedPath,
                'thumbnail_path' => $thumbPath,
                'video_mime' => 'video/mp4',
                'video_size_bytes' => $storage->size($processedPath),
                'duration_seconds' => $metadata['duration_seconds'],
                'width' => $metadata['width'],
                'height' => $metadata['height'],
                'codec' => $metadata['codec'],
                'frame_rate' => $metadata['frame_rate'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Video processing failed', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
            ]);

            $lifecycle->markFailed($video, $e->getMessage());
            throw $e;
        } finally {
            $this->cleanupTempDirectory($tempDir);
        }
    }

    private function cleanupTempDirectory(string $tempDir): void
    {
        if (! is_dir($tempDir)) {
            return;
        }

        foreach (glob($tempDir . '/*') ?: [] as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }

        @rmdir($tempDir);
    }
}
