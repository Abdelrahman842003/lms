<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAttachment;
use App\Domains\Videos\Models\VideoPlaybackToken;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VideoStreamingService
{
    public function __construct(
        private readonly VideoStorageService $storage,
        private readonly VideoAuthorizationService $authorization,
    ) {}

    /**
     * Validate playback token and get the student associated with it.
     *
     * @throws AuthorizationException
     */
    public function validateTokenAndGetStudent(Video $video, string $rawToken): Student
    {
        $tokenHash = hash('sha256', $rawToken);
        $playbackToken = VideoPlaybackToken::query()
            ->where('token_hash', $tokenHash)
            ->where('video_id', $video->id)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $playbackToken) {
            throw new AuthorizationException('رمز التشغيل غير صالح أو منتهي الصلاحية.');
        }

        /** @var Student $student */
        $student = Student::findOrFail($playbackToken->student_id);

        // Update last_used_at
        $playbackToken->update(['last_used_at' => now()]);

        return $student;
    }

    /**
     * Get a signed streaming URL for the video.
     *
     * @return array{url: string, expires_in: int}
     * @throws AuthorizationException
     */
    public function getStreamUrl(Video $video, Student $student): array
    {
        $this->authorization->assertStudentCanView($video, $student);

        if (! $video->processed_path || ! $this->storage->exists($video->processed_path)) {
            abort(404, 'Video file not found');
        }

        $expiresAt = Carbon::now()->addHour();
        $signedUrl = $this->storage->temporaryUrl(
            $video->processed_path,
            $expiresAt,
            [
                'ResponseContentType' => 'video/mp4',
                'ResponseContentDisposition' => 'inline',
            ]
        );

        return [
            'url' => $signedUrl,
            'expires_in' => 3600,
        ];
    }

    /**
     * Stream video content directly or redirect to signed URL.
     */
    public function streamVideo(Video $video, Student $student): RedirectResponse|StreamedResponse
    {
        $this->authorization->assertStudentCanView($video, $student);

        if (! $video->processed_path || ! $this->storage->exists($video->processed_path)) {
            abort(404, 'Video file not found');
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $video->processed_path,
                Carbon::now()->addSeconds(45),
                [
                    'ResponseContentType' => 'video/mp4',
                    'ResponseContentDisposition' => 'inline',
                ]
            );

            return redirect()->away($signedUrl, 302, [
                'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma' => 'no-cache',
            ]);
        } catch (\Throwable) {
            return $this->streamPrivateFile($video->processed_path, 'video/mp4', false);
        }
    }

    /**
     * Get thumbnail URL or stream it directly.
     */
    public function getThumbnailStream(Video $video, Student $student): RedirectResponse|StreamedResponse
    {
        $this->authorization->assertStudentCanView($video, $student);

        if (! $video->thumbnail_path || ! $this->storage->exists($video->thumbnail_path)) {
            abort(404, 'Thumbnail not found');
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $video->thumbnail_path,
                Carbon::now()->addSeconds(45),
                ['ResponseContentType' => 'image/jpeg']
            );

            return redirect()->away($signedUrl);
        } catch (\Throwable) {
            return $this->streamPrivateFile($video->thumbnail_path, 'image/jpeg', false);
        }
    }

    /**
     * Get attachment view URL.
     *
     * @return array{url: string, mime_type: string, file_name: string, expires_in: int}
     */
    public function getAttachmentViewUrl(Video $video, string $attachmentId, Student $student): array
    {
        $this->authorization->assertStudentCanView($video, $student);

        $attachment = VideoAttachment::query()
            ->where('video_id', $video->id)
            ->findOrFail($attachmentId);

        if (! $this->storage->exists($attachment->file_path)) {
            abort(404, 'Attachment not found');
        }

        $signedUrl = $this->storage->temporaryUrl(
            $attachment->file_path,
            Carbon::now()->addMinutes(30),
            [
                'ResponseContentType' => $attachment->mime_type,
                'ResponseContentDisposition' => 'inline; filename="' . addslashes($attachment->file_name) . '"',
            ]
        );

        return [
            'url' => $signedUrl,
            'mime_type' => $attachment->mime_type,
            'file_name' => $attachment->file_name,
            'expires_in' => 1800,
        ];
    }

    /**
     * Download attachment (redirect to signed URL or stream directly).
     */
    public function downloadAttachment(Video $video, string $attachmentId, Student $student, bool $inline = false): RedirectResponse|StreamedResponse
    {
        $this->authorization->assertStudentCanView($video, $student);

        $attachment = VideoAttachment::query()
            ->where('video_id', $video->id)
            ->findOrFail($attachmentId);

        if (! $this->storage->exists($attachment->file_path)) {
            abort(404, 'Attachment not found');
        }

        // For in-app viewers (iframe/image), stream directly from backend to keep same-origin behavior.
        if ($inline) {
            return $this->streamPrivateFile($attachment->file_path, $attachment->mime_type, false, $attachment->file_name);
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $attachment->file_path,
                Carbon::now()->addSeconds(90),
                [
                    'ResponseContentType' => $attachment->mime_type,
                    'ResponseContentDisposition' => 'attachment; filename="' . addslashes($attachment->file_name) . '"',
                ]
            );

            return redirect()->away($signedUrl);
        } catch (\Throwable) {
            return $this->streamPrivateFile($attachment->file_path, $attachment->mime_type, true, $attachment->file_name);
        }
    }

    /**
     * Stream a private file directly from storage.
     */
    private function streamPrivateFile(string $path, string $mimeType, bool $download, ?string $fileName = null): StreamedResponse
    {
        $size = $this->storage->size($path);

        return response()->stream(function () use ($path): void {
            $stream = $this->storage->readStream($path);
            if (! is_resource($stream)) {
                return;
            }

            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => (string) $size,
            'Content-Disposition' => $download
                ? 'attachment; filename="' . ($fileName ?: 'file') . '"'
                : 'inline',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Accept-Ranges' => 'bytes',
        ]);
    }
}
