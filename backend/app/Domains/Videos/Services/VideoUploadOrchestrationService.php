<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\DTOs\CreateVideoData;
use App\Domains\Videos\DTOs\VideoActorContext;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Enums\VideoUploadSessionStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoUploadSession;
use App\Domains\Subscriptions\Services\StorageQuotaService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Orchestrates the new Direct-to-R2 multipart upload flow.
 *
 * The server NEVER receives video bytes.
 * It only:
 *   1. Creates the multipart session on R2 and issues presigned URLs.
 *   2. Verifies the complete request and calls R2 completeMultipartUpload.
 *   3. Marks the DB records and dispatches the processing job.
 *   4. Handles abort.
 */
class VideoUploadOrchestrationService
{
    public function __construct(
        private readonly R2MultipartService $r2,
        private readonly VideoSettingsService $settings,
        private readonly VideoLifecycleService $lifecycle,
        private readonly StorageQuotaService $storageQuota,
    ) {}

    // ─────────────────────────────────────────────────────────────────
    // STEP 1  –  Initiate
    // ─────────────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $fileDeclaration  Keys: file_name, file_mime, file_size, total_parts
     * @return array<string, mixed>  Payload for the frontend
     */
    public function initiateUpload(
        CreateVideoData $data,
        VideoActorContext $context,
        array $fileDeclaration,
        string $initiatorIp
    ): array {
        if (! $this->settings->directUploadEnabled()) {
            throw new AuthorizationException('رفع الفيديو المباشر غير مفعّل حالياً.');
        }

        // Check plan limits using declared file size
        $this->lifecycle->assertPlanVideoConstraintsForDeclaredSize(
            $context,
            (int) $fileDeclaration['file_size']
        );

        $contentType  = (string) $fileDeclaration['file_mime'];
        $totalParts   = (int) $fileDeclaration['total_parts'];
        $declaredSize = (int) $fileDeclaration['file_size'];
        $declaredName = (string) $fileDeclaration['file_name'];

        // Build a safe, unpredictable object key
        $objectKey = $this->buildObjectKey($context, $contentType);

        return DB::transaction(function () use (
            $data, $context, $objectKey, $contentType,
            $totalParts, $declaredSize, $declaredName,
            $fileDeclaration, $initiatorIp
        ): array {
            // Create the Video record in UPLOADING state
            $video = Video::query()->create([
                'owner_type'             => $context->ownerType,
                'owner_id'               => $context->ownerId,
                'uploader_type'          => $context->uploaderMorphType(),
                'uploader_id'            => $context->uploaderId(),
                'teacher_reference_id'   => $data->teacherReferenceId ?? $context->teacherReference?->id,
                'teacher_reference_name' => $data->teacherReferenceName ?? $context->teacherReference?->name,
                'academy_id'             => $context->academyId,
                'grade_id'               => $data->gradeId,
                'lecture_id'             => $data->lectureId,
                'lesson_id'              => $data->lessonId,
                'title'                  => $data->title,
                'description'            => $data->description,
                'status'                 => VideoStatus::UPLOADING,
                'processing_status'      => VideoProcessingStatus::PENDING,
                'scheduled_at'           => $data->scheduledAt,
                'available_from'         => $data->availableFrom,
                'available_until'        => $data->availableUntil,
                'original_path'          => $objectKey,
                'video_mime'             => $contentType,
                'video_size_bytes'       => $declaredSize,
            ]);

            $video->groups()->sync($data->groupIds);

            // Create multipart upload on R2 — server does NOT touch video bytes
            $r2UploadId = $this->r2->createMultipartUpload($objectKey, $contentType);

            // Generate all presigned URLs up-front
            $ttl        = $this->settings->presignedUrlTtlSeconds();
            $partUrls   = $this->r2->presignAllPartUrls($objectKey, $r2UploadId, $totalParts, $ttl);

            // Persist the session
            $session = VideoUploadSession::query()->create([
                'video_id'          => $video->id,
                'uploader_type'     => $context->uploaderMorphType(),
                'uploader_id'       => $context->uploaderId(),
                'r2_upload_id'      => $r2UploadId,
                'object_key'        => $objectKey,
                'declared_filename' => $declaredName,
                'declared_mime'     => $contentType,
                'declared_size_bytes' => $declaredSize,
                'total_parts'       => $totalParts,
                'status'            => VideoUploadSessionStatus::PENDING_UPLOAD,
                'initiator_ip'      => $initiatorIp,
            ]);

            $this->logAudit('upload.initiated', $video, $context, [
                'session_id'   => $session->id,
                'object_key'   => $objectKey,
                'total_parts'  => $totalParts,
                'declared_size' => $declaredSize,
                'declared_mime' => $contentType,
            ]);

            // Convert the keyed map {1: url, 2: url} → [{part_number: 1, url: ...}, ...]
            $presignedParts = array_map(
                static fn (int $partNumber, string $url) => [
                    'part_number' => $partNumber,
                    'url'         => $url,
                ],
                array_keys($partUrls),
                array_values($partUrls),
            );

            return [
                'session_id'       => $session->id,
                'video_id'         => $video->id,
                'chunk_size_bytes' => $this->settings->chunkSizeMb() * 1024 * 1024,
                'max_concurrent'   => $this->settings->maxConcurrentChunks(),
                'retry_attempts'   => $this->settings->partRetryAttempts(),
                'presigned_parts'  => $presignedParts,
                'presigned_ttl'    => $ttl,
            ];
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 2  –  Complete
    // ─────────────────────────────────────────────────────────────────

    /**
     * @param  array<int, array{part_number: int, etag: string}>  $parts  (ignored — ETags fetched from R2 directly)
     * @return array<string, mixed>
     */
    public function completeUpload(
        string $sessionId,
        array $parts,
        string $uploaderType,
        string $uploaderId
    ): array {
        $session = VideoUploadSession::query()->findOrFail($sessionId);

        // Ownership check
        if (! $session->isOwnedBy($uploaderType, $uploaderId)) {
            throw new AuthorizationException('غير مصرح بإكمال هذا الرفع.');
        }

        // State check
        if ($session->status->isTerminal()) {
            throw new AuthorizationException('جلسة الرفع منتهية أو ملغاة مسبقاً.');
        }

        $session->update(['status' => VideoUploadSessionStatus::COMPLETING]);

        // Fetch ETags directly from R2 — browser CORS cannot expose ETag headers
        $sdkParts = $this->r2->listParts($session->object_key, $session->r2_upload_id);

        try {
            $this->r2->completeMultipartUpload(
                $session->object_key,
                $session->r2_upload_id,
                $sdkParts,
            );
        } catch (\Throwable $e) {
            $session->update(['status' => VideoUploadSessionStatus::FAILED]);
            $video = $session->video;
            if ($video) {
                $video->update([
                    'status'           => VideoStatus::FAILED,
                    'processing_error' => 'فشل إكمال الرفع: ' . $e->getMessage(),
                ]);
            }

            Log::error('completeMultipartUpload failed', [
                'session_id' => $sessionId,
                'error'      => $e->getMessage(),
            ]);

            throw $e;
        }

        // ── Finalize verification ──────────────────────────────────
        $meta = $this->r2->objectMeta($session->object_key);

        $session->update([
            'status'       => VideoUploadSessionStatus::COMPLETED,
            'completed_at' => now(),
        ]);

        $video = $session->video;
        $verifiedSize = (int) ($meta['size'] ?? $session->declared_size_bytes);

        $video->update([
            'status'           => VideoStatus::UPLOADED,
            'processing_status' => VideoProcessingStatus::PENDING,
            'original_path'    => $session->object_key,
            'video_size_bytes' => $verifiedSize,
            'video_mime'       => $meta['content_type'] ?: $session->declared_mime,
        ]);

        // Increment storage quota with the verified file size
        $owner = $this->resolveOwnerForVideo($video);
        if ($owner !== null && $verifiedSize > 0) {
            $this->storageQuota->incrementUsage($owner, $verifiedSize);
        }

        // Dispatch processing job (FFmpeg transcoding on server — server DOES touch bytes
        // only for transcoding, which is necessary and server-side by design)
        \App\Domains\Videos\Jobs\ProcessUploadedVideoJob::dispatch($video->id);

        $this->logAudit('upload.completed', $video, null, [
            'session_id'  => $sessionId,
            'uploader_id' => $uploaderId,
            'parts_count' => count($parts),
            'object_key'  => $session->object_key,
            'verified_size' => $meta['size'] ?? null,
        ]);

        return [
            'video_id' => $video->id,
            'status'   => $video->status->value,
        ];
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 3  –  Abort
    // ─────────────────────────────────────────────────────────────────

    public function abortUpload(
        string $sessionId,
        string $uploaderType,
        string $uploaderId,
        string $reason = ''
    ): void {
        $session = VideoUploadSession::query()->findOrFail($sessionId);

        if (! $session->isOwnedBy($uploaderType, $uploaderId)) {
            throw new AuthorizationException('غير مصرح بإلغاء هذا الرفع.');
        }

        if ($session->status === VideoUploadSessionStatus::COMPLETED) {
            throw new AuthorizationException('لا يمكن إلغاء رفع مكتمل.');
        }

        if ($session->status->isTerminal()) {
            return; // Already aborted/failed — idempotent
        }

        // Tell R2 to clean up any uploaded parts
        $this->r2->abortMultipartUpload($session->object_key, $session->r2_upload_id);

        $session->update([
            'status'      => VideoUploadSessionStatus::ABORTED,
            'aborted_at'  => now(),
            'abort_reason' => $reason,
        ]);

        $video = $session->video;
        if ($video) {
            $video->update(['status' => VideoStatus::FAILED]);

            $this->logAudit('upload.aborted', $video, null, [
                'session_id'  => $sessionId,
                'uploader_id' => $uploaderId,
                'reason'      => $reason,
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

    private function buildObjectKey(VideoActorContext $context, string $contentType): string
    {
        $ext = match ($contentType) {
            'video/mp4'          => 'mp4',
            'video/quicktime'    => 'mov',
            'video/x-matroska'   => 'mkv',
            'video/webm'         => 'webm',
            default              => 'bin',
        };

        return sprintf(
            'videos/originals/%s/%s/%s.%s',
            $context->ownerType->value,
            $context->ownerId,
            Str::uuid()->toString(),
            $ext
        );
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function logAudit(string $event, Video $video, ?VideoActorContext $context, array $meta = []): void
    {
        try {
            activity('video_uploads')
                ->causedBy($context?->uploader ?? null)
                ->performedOn($video)
                ->withProperties($meta)
                ->event($event)
                ->log($event);
        } catch (\Throwable) {
            // Never block the upload flow for a logging failure
        }
    }

    private function resolveOwnerForVideo(Video $video): Academy|Teacher|null
    {
        $ownerType = $video->owner_type instanceof \App\Domains\Videos\Enums\VideoOwnerType
            ? $video->owner_type
            : \App\Domains\Videos\Enums\VideoOwnerType::from((string) $video->owner_type);

        if ($ownerType === \App\Domains\Videos\Enums\VideoOwnerType::ACADEMY) {
            return Academy::query()->find($video->owner_id);
        }

        if ($ownerType === \App\Domains\Videos\Enums\VideoOwnerType::INDEPENDENT_TEACHER) {
            return Teacher::query()->find($video->owner_id);
        }

        return null;
    }
}
