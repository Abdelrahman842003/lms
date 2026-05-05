<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Videos\Models\VideoUploadPart;
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
     * @param  array<string, mixed>  $fileDeclaration  Keys: file_name, file_mime, file_size, total_parts, file_fingerprint
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

        $fingerprint = (string) ($fileDeclaration['file_fingerprint'] ?? '');
        $declaredName = (string) ($fileDeclaration['file_name'] ?? '');
        $declaredSize = (int) ($fileDeclaration['file_size'] ?? 0);
        $contentType  = (string) ($fileDeclaration['file_mime'] ?? '');
        $totalParts   = (int) ($fileDeclaration['total_parts'] ?? 0);

        $existingSession = null;

        // Try to find a resumable session for this user + fingerprint
        if ($fingerprint) {
            $existingSession = VideoUploadSession::query()
                ->where('uploader_type', $context->uploaderMorphType())
                ->where('uploader_id', $context->uploaderId())
                ->where('file_fingerprint', $fingerprint)
                ->whereNotIn('status', [
                    VideoUploadSessionStatus::COMPLETED,
                    VideoUploadSessionStatus::ABORTED,
                ])
                ->latest()
                ->first();
        }

        // Fallback resume: match by declared file metadata (name/size/mime)
        if (! $existingSession && $declaredName !== '' && $declaredSize > 0 && $contentType !== '') {
            $existingSession = VideoUploadSession::query()
                ->where('uploader_type', $context->uploaderMorphType())
                ->where('uploader_id', $context->uploaderId())
                ->where('declared_filename', $declaredName)
                ->where('declared_size_bytes', $declaredSize)
                ->where('declared_mime', $contentType)
                ->whereNotIn('status', [
                    VideoUploadSessionStatus::COMPLETED,
                    VideoUploadSessionStatus::ABORTED,
                ])
                ->where('initiated_at', '>=', now()->subDays(7))
                ->latest()
                ->first();
        }

        if ($existingSession && ! $existingSession->status->isTerminal()) {
            Log::info('Found existing session for resume, resuming instead of creating new.', [
                'session_id' => $existingSession->id,
                'fingerprint' => $fingerprint,
            ]);

            return $this->resumeUpload(
                $existingSession->id,
                $context->uploaderMorphType(),
                (string) $context->uploaderId()
            );
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

        // Create the Video record outside the transaction
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

        // Create multipart upload on R2 — HTTP call outside transaction
        $r2UploadId = $this->r2->createMultipartUpload($objectKey, $contentType);

        // Generate all presigned URLs up-front
        $ttl        = $this->settings->presignedUrlTtlSeconds();
        $partUrls   = $this->r2->presignAllPartUrls($objectKey, $r2UploadId, $totalParts, $ttl);

        // Persist the session and parts in a transaction
        $session = DB::transaction(function () use (
            $video,
            $context,
            $r2UploadId,
            $objectKey,
            $contentType,
            $declaredSize,
            $declaredName,
            $totalParts,
            $initiatorIp,
            $fingerprint
        ): VideoUploadSession {
            $session = VideoUploadSession::query()->create([
                'video_id'          => $video->id,
                'file_fingerprint'  => $fingerprint,
                'uploader_type'     => $context->uploaderMorphType(),
                'uploader_id'       => $context->uploaderId(),
                'r2_upload_id'      => $r2UploadId,
                'object_key'        => $objectKey,
                'declared_filename' => $declaredName,
                'declared_mime'     => $contentType,
                'declared_size_bytes' => $declaredSize,
                'total_parts'       => $totalParts,
                'status'            => VideoUploadSessionStatus::INITIATING,
                'initiator_ip'      => $initiatorIp,
                'initiated_at'      => now(),
            ]);

            // Create pending parts
            $chunkSize = $this->settings->chunkSizeMb() * 1024 * 1024;
            $partsData = [];
            for ($i = 1; $i <= $totalParts; $i++) {
                $isLast = ($i === $totalParts);
                $size = $isLast ? ($declaredSize - (($totalParts - 1) * $chunkSize)) : $chunkSize;
                
                $partsData[] = [
                    'id'           => Str::uuid()->toString(),
                    'session_id'   => $session->id,
                    'part_number'  => $i,
                    'size_bytes'   => $size,
                    'status'       => 'pending',
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ];
            }
            
            VideoUploadPart::query()->insert($partsData);

            return $session;
        });

        // Transition to UPLOADING now that metadata is saved
        $session->update(['status' => VideoUploadSessionStatus::UPLOADING]);

        $this->logAudit('upload.initiated', $video, $context, [
            'session_id'   => $session->id,
            'object_key'   => $objectKey,
            'total_parts'  => $totalParts,
            'declared_size' => $declaredSize,
            'declared_mime' => $contentType,
            'fingerprint'   => $fingerprint
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
            'total_parts'      => $totalParts,
            'uploaded_parts'   => [],
            'progress'         => 0,
        ];
    }

    /**
     * Resume an interrupted multipart upload.
     */
    public function resumeUpload(
        string $sessionId,
        string $uploaderType,
        string $uploaderId
    ): array {
        $session = VideoUploadSession::query()->with('parts')->findOrFail($sessionId);

        // Ownership check
        if (! $session->isOwnedBy($uploaderType, $uploaderId)) {
            throw new AuthorizationException('غير مصرح باستكمال هذا الرفع.');
        }

        // Terminal state check
        if ($session->status->isTerminal()) {
            throw new AuthorizationException('جلسة الرفع منتهية أو ملغاة مسبقاً.');
        }

        // Sync from R2 to recover progress if the browser didn't report part success.
        $this->syncUploadedPartsFromR2($session);

        // Legacy safety: if this session predates parts tracking, seed pending parts now.
        $this->seedPartsIfMissing($session);

        // Fetch missing parts from DB after sync
        $missingPartsRecords = $session->parts()->where('status', '!=', 'uploaded')->get();
        
        $ttl = $this->settings->presignedUrlTtlSeconds();
        $missingParts = [];
        
        foreach ($missingPartsRecords as $part) {
            $missingParts[] = [
                'part_number' => $part->part_number,
                'url'         => $this->r2->presignPartUrl($session->object_key, $session->r2_upload_id, $part->part_number, $ttl),
            ];
        }

        $uploadedParts = $session->parts()
            ->where('status', 'uploaded')
            ->pluck('part_number')
            ->toArray();

        $uploadedCount = count($uploadedParts);
        $progress = $session->total_parts > 0 
            ? min(99, (int) round(($uploadedCount / $session->total_parts) * 100))
            : 0;

        // If it was paused/interrupted, move it back to uploading
        if ($session->status !== VideoUploadSessionStatus::UPLOADING) {
            $session->update(['status' => VideoUploadSessionStatus::UPLOADING]);
        }

        return [
            'session_id'       => $session->id,
            'video_id'         => $session->video_id,
            'file_name'        => $session->declared_filename,
            'file_size'        => $session->declared_size_bytes,
            'total_parts'      => $session->total_parts,
            'chunk_size_bytes' => $this->settings->chunkSizeMb() * 1024 * 1024,
            'missing_parts'    => $missingParts,
            'uploaded_parts'   => $uploadedParts,
            'uploaded_count'   => $uploadedCount,
            'progress'         => $progress,
            'presigned_ttl'    => $ttl,
        ];
    }

    // ─────────────────────────────────────────────────────────────────
    // NEW: Report Part Success
    // ─────────────────────────────────────────────────────────────────

    public function reportPartSuccess(
        string $sessionId,
        int $partNumber,
        string $etag,
        string $uploaderType,
        string $uploaderId
    ): void {
        $session = VideoUploadSession::query()->findOrFail($sessionId);

        if (! $session->isOwnedBy($uploaderType, $uploaderId)) {
            throw new AuthorizationException('غير مصرح بتحديث هذه الجلسة.');
        }

        VideoUploadPart::query()
            ->where('session_id', $sessionId)
            ->where('part_number', $partNumber)
            ->update([
                'status' => 'uploaded',
                'etag'   => $etag,
                'updated_at' => now(),
            ]);
    }

    // ─────────────────────────────────────────────────────────────────
    // NEW: Pause Upload
    // ─────────────────────────────────────────────────────────────────

    public function pauseUpload(
        string $sessionId,
        string $uploaderType,
        string $uploaderId
    ): void {
        $session = VideoUploadSession::query()->findOrFail($sessionId);

        if (! $session->isOwnedBy($uploaderType, $uploaderId)) {
            throw new AuthorizationException('غير مصرح بإيقاف هذا الرفع.');
        }

        if ($session->status === VideoUploadSessionStatus::UPLOADING) {
            $session->update(['status' => VideoUploadSessionStatus::PAUSED]);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 2  –  Complete
    // ─────────────────────────────────────────────────────────────────

    /**
     * @param  array<int, array{part_number: int, etag: string}>  $parts  (ignored — ETags taken from DB)
     * @return array<string, mixed>
     */
    public function completeUpload(
        string $sessionId,
        array $parts,
        string $uploaderType,
        string $uploaderId
    ): array {
        $session = VideoUploadSession::query()->with('parts')->findOrFail($sessionId);

        // Ownership check
        if (! $session->isOwnedBy($uploaderType, $uploaderId)) {
            throw new AuthorizationException('غير مصرح بإكمال هذا الرفع.');
        }

        // State check
        if ($session->status->isTerminal()) {
            throw new AuthorizationException('جلسة الرفع منتهية أو ملغاة مسبقاً.');
        }

        $session->update(['status' => VideoUploadSessionStatus::COMPLETING]);

        // Use ETags from DB as the source of truth, but sync from R2 if incomplete.
        $dbParts = $session->parts()
            ->where('status', 'uploaded')
            ->orderBy('part_number')
            ->get();

        if ($dbParts->count() < $session->total_parts) {
            $this->syncUploadedPartsFromR2($session);

            $dbParts = $session->parts()
                ->where('status', 'uploaded')
                ->orderBy('part_number')
                ->get();
        }

        if ($dbParts->count() < $session->total_parts) {
            $session->update(['status' => VideoUploadSessionStatus::INTERRUPTED]);
            throw new \Exception("لم يتم تسجيل جميع الأجزاء في قاعدة البيانات ({$dbParts->count()} من اصل {$session->total_parts}). يرجى التأكد من رفع جميع الأجزاء.");
        }

        $formattedParts = $dbParts->map(fn($p) => [
            'PartNumber' => $p->part_number,
            'ETag'       => $p->etag,
        ])->toArray();

        try {
            $this->r2->completeMultipartUpload(
                $session->object_key,
                $session->r2_upload_id,
                $formattedParts,
            );
        } catch (\Throwable $e) {
            $session->update(['status' => VideoUploadSessionStatus::FAILED]);
            $video = $session->video;
            if ($video) {
                $video->update([
                    'status'           => VideoStatus::FAILED,
                    'processing_error' => 'فشل إكمال الرفع في R2: ' . $e->getMessage(),
                ]);
            }
            throw $e;
        }

        // ── Finalize verification ──────────────────────────────────
        $meta = $this->r2->objectMeta($session->object_key);
        
        $session->update([
            'status'       => VideoUploadSessionStatus::COMPLETED,
            'completed_at' => now(),
        ]);

        $video = $session->video;
        if (!$video) {
            throw new \Exception('الفيديو المرتبط بهذه الجلسة لم يعد موجوداً.');
        }

        $verifiedSize = (int) (($meta['size'] ?? 0) ?: $session->declared_size_bytes);

        $video->update([
            'status'           => VideoStatus::UPLOADED,
            'processing_status' => VideoProcessingStatus::PENDING,
            'original_path'    => $session->object_key,
            'video_size_bytes' => $verifiedSize,
            'video_mime'       => ($meta['content_type'] ?? null) ?: $session->declared_mime,
        ]);

        // Increment storage quota
        $owner = $this->resolveOwnerForVideo($video);
        if ($owner !== null && $verifiedSize > 0) {
            $this->storageQuota->incrementUsage($owner, $verifiedSize);
        }

        // Dispatch processing job
        \App\Domains\Videos\Jobs\ProcessUploadedVideoJob::dispatch($video->id);

        $this->logAudit('upload.completed', $video, null, [
            'session_id'  => $sessionId,
            'uploader_id' => $uploaderId,
            'parts_count' => $dbParts->count(),
            'object_key'  => $session->object_key,
            'verified_size' => $verifiedSize,
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
            'video/mpeg'         => 'mpeg',
            'video/x-mpeg'       => 'mpeg',
            'video/x-msvideo'    => 'avi',
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

    /**
     * Sync uploaded parts from R2 to DB to enable reliable resume/complete.
     */
    /**
     * @return array<int, array{PartNumber: int, ETag: string}>
     */
    private function syncUploadedPartsFromR2(VideoUploadSession $session): array
    {
        try {
            $r2Parts = $this->r2->listParts($session->object_key, $session->r2_upload_id);
        } catch (\Throwable $e) {
            Log::warning('R2 listParts failed while syncing upload progress', [
                'session_id' => $session->id,
                'upload_id'  => $session->r2_upload_id,
                'error'      => $e->getMessage(),
            ]);
            return [];
        }

        if (empty($r2Parts)) {
            return [];
        }

        $chunkSize = $this->settings->chunkSizeMb() * 1024 * 1024;
        $declaredSize = (int) ($session->declared_size_bytes ?? 0);
        $totalParts = (int) ($session->total_parts ?? 0);

        foreach ($r2Parts as $part) {
            $partNumber = (int) ($part['PartNumber'] ?? 0);
            $etag = (string) ($part['ETag'] ?? '');

            if ($partNumber <= 0) {
                continue;
            }

            $sizeBytes = 0;
            if ($declaredSize > 0 && $totalParts > 0) {
                $isLast = ($partNumber === $totalParts);
                $sizeBytes = $isLast
                    ? max(0, $declaredSize - (($totalParts - 1) * $chunkSize))
                    : $chunkSize;
            }

            VideoUploadPart::query()->updateOrCreate(
                [
                    'session_id'  => $session->id,
                    'part_number' => $partNumber,
                ],
                [
                    'size_bytes' => $sizeBytes,
                    'status'     => 'uploaded',
                    'etag'       => $etag,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        return $r2Parts;
    }

    /**
     * Seed missing part rows for legacy sessions that predate video_upload_parts.
     */
    private function seedPartsIfMissing(VideoUploadSession $session): void
    {
        if ($session->parts()->count() > 0) {
            return;
        }

        $totalParts = (int) ($session->total_parts ?? 0);
        if ($totalParts <= 0) {
            return;
        }

        $chunkSize = $this->settings->chunkSizeMb() * 1024 * 1024;
        $declaredSize = (int) ($session->declared_size_bytes ?? 0);

        $partsData = [];
        for ($i = 1; $i <= $totalParts; $i++) {
            $isLast = ($i === $totalParts);
            $size = $declaredSize > 0
                ? ($isLast ? max(0, $declaredSize - (($totalParts - 1) * $chunkSize)) : $chunkSize)
                : 0;

            $partsData[] = [
                'id'           => Str::uuid()->toString(),
                'session_id'   => $session->id,
                'part_number'  => $i,
                'size_bytes'   => $size,
                'status'       => 'pending',
                'upload_attempts' => 0,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        VideoUploadPart::query()->insert($partsData);
    }
}
