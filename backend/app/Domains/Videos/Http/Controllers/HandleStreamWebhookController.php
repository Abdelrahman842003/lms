<?php

declare(strict_types=1);

namespace App\Domains\Videos\Http\Controllers;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Services\StreamQuotaService;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Services\CloudflareStreamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Handles incoming webhooks from Cloudflare Stream.
 *
 * Stream sends a webhook when:
 *  - A video finishes processing → "ready" state
 *  - A video fails processing → "error" state
 *
 * Route: POST /webhooks/cloudflare-stream (no auth middleware — verified via signature)
 */
class HandleStreamWebhookController
{
    public function __construct(
        private readonly CloudflareStreamService $stream,
        private readonly StreamQuotaService $quota,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        // ── 1. Verify webhook signature ─────────────────────────────
        $payload   = $request->getContent();
        $signature = (string) $request->header('Webhook-Signature', '');

        if (! $this->stream->verifyWebhookSignature($payload, $signature)) {
            Log::warning('Cloudflare Stream webhook: invalid signature', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['error' => 'Invalid signature'], 403);
        }

        // ── 2. Parse webhook body ───────────────────────────────────
        $data     = $request->json()->all();
        $videoUid = $data['uid'] ?? null;
        $status   = $data['status'] ?? [];
        $state    = $status['state'] ?? 'unknown';

        if (! $videoUid) {
            return response()->json(['error' => 'Missing video UID'], 400);
        }

        Log::info('Cloudflare Stream webhook received', [
            'uid'   => $videoUid,
            'state' => $state,
        ]);

        // ── 3. Find the video ───────────────────────────────────────
        $video = Video::query()->where('stream_uid', $videoUid)->first();

        if (! $video) {
            // May be an old/unknown video — acknowledge but don't fail
            Log::warning('Cloudflare Stream webhook: video not found', [
                'uid' => $videoUid,
            ]);

            return response()->json(['status' => 'ignored']);
        }

        // ── 4. Process based on state ───────────────────────────────
        match ($state) {
            'ready'     => $this->handleReady($video, $data),
            'error'     => $this->handleError($video, $data),
            'inprogress' => $this->handleInProgress($video),
            default     => Log::info("Cloudflare Stream webhook: unhandled state '{$state}'", [
                'uid' => $videoUid,
            ]),
        };

        return response()->json(['status' => 'ok']);
    }

    /**
     * Video is ready for playback.
     *
     * @param  array<string, mixed>  $data
     */
    private function handleReady(Video $video, array $data): void
    {
        $duration       = (float) ($data['duration'] ?? 0);
        $durationSeconds = (int) round($duration);
        $durationMinutes = (int) ceil($duration / 60);
        $thumbnail       = $data['thumbnail'] ?? null;
        $playback        = $data['playback'] ?? [];
        $input           = $data['input'] ?? [];

        // Extract video dimensions from the first input
        $width  = (int) ($input['width'] ?? 0);
        $height = (int) ($input['height'] ?? 0);

        // Already processed — skip (idempotent)
        if ($video->processing_status === VideoProcessingStatus::SUCCEEDED
            && $video->status === VideoStatus::READY) {
            return;
        }

        $video->update([
            'status'            => VideoStatus::READY,
            'processing_status' => VideoProcessingStatus::SUCCEEDED,
            'duration_seconds'  => $durationSeconds,
            'width'             => $width > 0 ? $width : $video->width,
            'height'            => $height > 0 ? $height : $video->height,
            'processing_error'  => null,
            // thumbnail_path stores the CF Stream auto-generated thumbnail URL
            'thumbnail_path'    => $thumbnail,
        ]);

        // ── Update storage quota ────────────────────────────────────
        $owner = $this->resolveOwner($video);
        if ($owner !== null && $durationMinutes > 0) {
            $this->quota->incrementStorageUsage($owner, $durationMinutes);
        }

        // ── Auto-publish or schedule ────────────────────────────────
        if ($video->scheduled_at && $video->scheduled_at->isFuture()) {
            $video->update(['status' => VideoStatus::SCHEDULED]);
            \App\Domains\Videos\Jobs\PublishScheduledVideoJob::dispatch($video->id)
                ->delay($video->scheduled_at);
        }

        Log::info('Cloudflare Stream: video ready', [
            'video_id' => $video->id,
            'uid'      => $video->stream_uid,
            'duration' => $durationSeconds,
        ]);
    }

    /**
     * Video processing failed on Cloudflare.
     *
     * @param  array<string, mixed>  $data
     */
    private function handleError(Video $video, array $data): void
    {
        $errorMessage = $data['status']['errorReasonCode'] ?? 'Unknown error';
        $errorText    = $data['status']['errorReasonText'] ?? '';

        $video->update([
            'status'            => VideoStatus::FAILED,
            'processing_status' => VideoProcessingStatus::FAILED,
            'processing_error'  => "Stream Error: {$errorMessage}. {$errorText}",
        ]);

        Log::error('Cloudflare Stream: video processing failed', [
            'video_id' => $video->id,
            'uid'      => $video->stream_uid,
            'error'    => $errorMessage,
        ]);
    }

    /**
     * Video is still being processed (encoding in progress).
     */
    private function handleInProgress(Video $video): void
    {
        if ($video->processing_status !== VideoProcessingStatus::RUNNING) {
            $video->update([
                'status'            => VideoStatus::PROCESSING,
                'processing_status' => VideoProcessingStatus::RUNNING,
            ]);
        }
    }

    private function resolveOwner(Video $video): Academy|Teacher|null
    {
        $ownerType = $video->owner_type instanceof VideoOwnerType
            ? $video->owner_type
            : VideoOwnerType::from((string) $video->owner_type);

        if ($ownerType === VideoOwnerType::ACADEMY) {
            return Academy::query()->find($video->owner_id);
        }

        if ($ownerType === VideoOwnerType::INDEPENDENT_TEACHER) {
            return Teacher::query()->find($video->owner_id);
        }

        return null;
    }
}
