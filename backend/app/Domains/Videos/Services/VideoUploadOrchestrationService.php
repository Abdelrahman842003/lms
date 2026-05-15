<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Services\StreamQuotaService;
use App\Domains\Videos\DTOs\CreateVideoData;
use App\Domains\Videos\DTOs\VideoActorContext;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Enums\VideoUploadSessionStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoUploadSession;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Orchestrates the Direct-to-Cloudflare-Stream upload flow via TUS.
 *
 * The server NEVER receives video bytes.
 * It only:
 *   1. Requests a TUS upload URL from Cloudflare Stream.
 *   2. Returns the URL to the frontend (tus-js-client uploads directly).
 *   3. Receives a webhook when Stream finishes processing.
 *   4. Handles abort.
 */
class VideoUploadOrchestrationService
{
    public function __construct(
        private readonly CloudflareStreamService $stream,
        private readonly VideoSettingsService $settings,
        private readonly VideoLifecycleService $lifecycle,
        private readonly VideoStorageService $storage,
        private readonly StreamQuotaService $streamQuota,
    ) {}

    // ─────────────────────────────────────────────────────────────────
    // STEP 1  –  Initiate (TUS Direct Upload)
    // ─────────────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $fileDeclaration  Keys: file_name, file_mime, file_size, estimated_duration_minutes
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

        $declaredName = (string) ($fileDeclaration['file_name'] ?? '');
        $declaredSize = (int) ($fileDeclaration['file_size'] ?? 0);
        $contentType  = (string) ($fileDeclaration['file_mime'] ?? '');
        $estimatedDurationMinutes = (int) ($fileDeclaration['estimated_duration_minutes'] ?? 0);

        // ── Check quota (minutes-based) ─────────────────────────────
        $owner = $this->resolveOwnerForContext($context);
        if ($owner !== null && $estimatedDurationMinutes > 0) {
            $this->streamQuota->assertCanUpload($owner, $estimatedDurationMinutes);
        }

        // ── Check plan video size constraint ────────────────────────
        $this->lifecycle->assertPlanVideoConstraintsForDeclaredSize(
            $context,
            $declaredSize
        );

        // ── Request TUS upload URL from Cloudflare Stream ───────────
        $maxDuration = (int) config('cloudflare.stream.max_duration_seconds', 7200);
        $uploadResult = $this->stream->createDirectUploadUrl($maxDuration, [
            'name'       => $declaredName,
            'uploader'   => $context->uploaderMorphType() . ':' . $context->uploaderId(),
            'academy_id' => $context->academyId ?? '',
        ]);

        $streamUid = $uploadResult['stream_uid'];
        $uploadUrl = $uploadResult['upload_url'];

        // ── Create Video record ─────────────────────────────────────
        $video = Video::query()->create([
            'stream_uid'             => $streamUid,
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
            'video_mime'             => $contentType,
            'video_size_bytes'       => $declaredSize,
        ]);

        $video->groups()->sync($data->groupIds);

        // ── Create upload session for audit ──────────────────────────
        $session = VideoUploadSession::query()->create([
            'video_id'          => $video->id,
            'uploader_type'     => $context->uploaderMorphType(),
            'uploader_id'       => $context->uploaderId(),
            'stream_uid'        => $streamUid,
            'tus_upload_url'    => $uploadUrl,
            'declared_filename' => $declaredName,
            'declared_mime'     => $contentType,
            'declared_size_bytes' => $declaredSize,
            'status'            => VideoUploadSessionStatus::UPLOADING,
            'initiator_ip'      => $initiatorIp,
            'initiated_at'      => now(),
        ]);

        $this->logAudit('upload.initiated', $video, $context, [
            'session_id'  => $session->id,
            'stream_uid'  => $streamUid,
            'declared_size' => $declaredSize,
            'declared_mime' => $contentType,
        ]);

        return [
            'session_id'  => $session->id,
            'video_id'    => $video->id,
            'stream_uid'  => $streamUid,
            'upload_url'  => $uploadUrl,
        ];
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 2  –  Complete
    // ─────────────────────────────────────────────────────────────────

    public function completeUpload(string $sessionId, string $uploaderType, string $uploaderId): array
    {
        $session = VideoUploadSession::query()->findOrFail($sessionId);

        if (! $session->isOwnedBy($uploaderType, $uploaderId)) {
            throw new AuthorizationException('غير مصرح بإكمال هذا الرفع.');
        }

        if ($session->status === VideoUploadSessionStatus::COMPLETED) {
            return [
                'video_id' => $session->video_id,
                'status'   => 'already_completed',
            ];
        }

        $session->update([
            'status'       => VideoUploadSessionStatus::COMPLETED,
            'completed_at' => now(),
        ]);

        $video = $session->video;
        if ($video) {
            $video->update(['status' => VideoStatus::UPLOADED]);
            $this->logAudit('upload.completed', $video, null, ['session_id' => $sessionId]);
        }

        return [
            'video_id' => $session->video_id,
            'status'   => 'completed',
        ];
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 2  –  Abort
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
            return; // Already aborted/failed
        }

        // Delete the video from Cloudflare Stream
        $streamUid = $session->stream_uid ?? $session->video?->stream_uid;
        if ($streamUid) {
            $this->stream->deleteVideo($streamUid);
        }

        $session->update([
            'status'       => VideoUploadSessionStatus::ABORTED,
            'aborted_at'   => now(),
            'abort_reason'  => $reason,
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
    // Attachment Uploads (still via R2)
    // ─────────────────────────────────────────────────────────────────

    public function initiateAttachmentUploads(Video $video, array $files): array
    {
        $results = [];
        $ttl     = $this->settings->presignedUrlTtlSeconds();

        // Standard S3/R2 putURL for attachments
        foreach ($files as $file) {
            $fileName = $file['name'] ?? 'attachment';
            $mimeType = $file['mime'] ?? 'application/octet-stream';

            $path   = $this->storage->generateAttachmentPath($video, $fileName);
            
            // Generate a simple presigned PUT URL
            $putUrl = \Illuminate\Support\Facades\Storage::disk('r2')->temporaryUrl(
                $path,
                now()->addSeconds($ttl),
                ['ResponseContentType' => $mimeType]
            );

            $results[] = [
                'name'      => $fileName,
                'put_url'   => $putUrl,
                'file_path' => $path,
                'mime_type' => $mimeType,
                'file_size' => (int) ($file['size'] ?? 0),
            ];
        }

        return $results;
    }

    public function completeAttachmentUploads(Video $video, array $attachments, VideoActorContext $actor): void
    {
        foreach ($attachments as $data) {
            $video->attachments()->create([
                'title'            => pathinfo($data['name'] ?? '', PATHINFO_FILENAME),
                'file_name'        => $data['name'] ?? 'attachment',
                'file_path'        => $data['file_path'],
                'mime_type'        => $data['mime_type'],
                'file_size'        => $data['file_size'],
                'uploaded_by_type' => $actor->uploaderMorphType(),
                'uploaded_by_id'   => $actor->uploaderId(),
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

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
            // Silence logging errors
        }
    }

    private function resolveOwnerForContext(VideoActorContext $context): Academy|Teacher|null
    {
        if ($context->ownerType === VideoOwnerType::ACADEMY) {
            return Academy::query()->find($context->ownerId);
        }

        if ($context->ownerType === VideoOwnerType::INDEPENDENT_TEACHER) {
            return Teacher::query()->find($context->ownerId);
        }

        return null;
    }
}
