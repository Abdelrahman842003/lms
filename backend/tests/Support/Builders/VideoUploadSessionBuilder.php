<?php

declare(strict_types=1);

namespace Tests\Support\Builders;

use App\Domains\Videos\DTOs\VideoActorContext;
use App\Domains\Videos\Enums\VideoUploadSessionStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoUploadSession;

/**
 * Builder for creating VideoUploadSession instances.
 * 
 * Provides a fluent interface for constructing upload sessions
 * with many optional parameters.
 * 
 * @see https://refactoring.guru/design-patterns/builder
 */
class VideoUploadSessionBuilder
{
    private ?string $videoId = null;
    private ?string $uploaderType = null;
    private ?string $uploaderId = null;
    private ?string $r2UploadId = null;
    private ?string $objectKey = null;
    private ?string $declaredFilename = null;
    private ?string $declaredMime = null;
    private int $declaredSizeBytes = 0;
    private int $totalParts = 1;
    private string $status = VideoUploadSessionStatus::PENDING_UPLOAD;
    private ?string $initiatorIp = null;
    private array $metadata = [];

    /**
     * Set the video for this upload session.
     */
    public function forVideo(Video $video): self
    {
        $this->videoId = $video->id;
        return $this;
    }

    /**
     * Set the video ID directly.
     */
    public function forVideoId(string $videoId): self
    {
        $this->videoId = $videoId;
        return $this;
    }

    /**
     * Set the uploader context.
     */
    public function withUploader(VideoActorContext $context): self
    {
        $this->uploaderType = $context->uploaderMorphType();
        $this->uploaderId = $context->uploaderId;
        return $this;
    }

    /**
     * Set uploader details directly.
     */
    public function withUploaderDetails(string $type, string $id): self
    {
        $this->uploaderType = $type;
        $this->uploaderId = $id;
        return $this;
    }

    /**
     * Set the R2 upload ID.
     */
    public function withR2UploadId(string $r2UploadId): self
    {
        $this->r2UploadId = $r2UploadId;
        return $this;
    }

    /**
     * Set the object key (storage path).
     */
    public function withObjectKey(string $objectKey): self
    {
        $this->objectKey = $objectKey;
        return $this;
    }

    /**
     * Set the declared file information.
     */
    public function withFileInfo(string $filename, string $mime, int $sizeBytes): self
    {
        $this->declaredFilename = $filename;
        $this->declaredMime = $mime;
        $this->declaredSizeBytes = $sizeBytes;
        return $this;
    }

    /**
     * Set the filename.
     */
    public function withFilename(string $filename): self
    {
        $this->declaredFilename = $filename;
        return $this;
    }

    /**
     * Set the MIME type.
     */
    public function withMime(string $mime): self
    {
        $this->declaredMime = $mime;
        return $this;
    }

    /**
     * Set the file size in bytes.
     */
    public function withSize(int $sizeBytes): self
    {
        $this->declaredSizeBytes = $sizeBytes;
        return $this;
    }

    /**
     * Set the total number of parts.
     */
    public function withTotalParts(int $totalParts): self
    {
        $this->totalParts = $totalParts;
        return $this;
    }

    /**
     * Set the session status.
     */
    public function withStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }

    /**
     * Mark as pending upload.
     */
    public function pendingUpload(): self
    {
        $this->status = VideoUploadSessionStatus::PENDING_UPLOAD;
        return $this;
    }

    /**
     * Mark as uploading.
     */
    public function uploading(): self
    {
        $this->status = VideoUploadSessionStatus::UPLOADING;
        return $this;
    }

    /**
     * Mark as completed.
     */
    public function completed(): self
    {
        $this->status = VideoUploadSessionStatus::COMPLETED;
        return $this;
    }

    /**
     * Mark as aborted.
     */
    public function aborted(): self
    {
        $this->status = VideoUploadSessionStatus::ABORTED;
        return $this;
    }

    /**
     * Set the initiator IP address.
     */
    public function fromIp(string $ip): self
    {
        $this->initiatorIp = $ip;
        return $this;
    }

    /**
     * Add metadata to the session.
     */
    public function withMetadata(array $metadata): self
    {
        $this->metadata = array_merge($this->metadata, $metadata);
        return $this;
    }

    /**
     * Build and persist the VideoUploadSession.
     */
    public function build(): VideoUploadSession
    {
        $this->validate();

        return VideoUploadSession::query()->create([
            'video_id'            => $this->videoId,
            'uploader_type'       => $this->uploaderType,
            'uploader_id'         => $this->uploaderId,
            'r2_upload_id'        => $this->r2UploadId,
            'object_key'          => $this->objectKey,
            'declared_filename'   => $this->declaredFilename,
            'declared_mime'       => $this->declaredMime,
            'declared_size_bytes' => $this->declaredSizeBytes,
            'total_parts'         => $this->totalParts,
            'status'              => $this->status,
            'initiator_ip'        => $this->initiatorIp,
            'metadata'            => $this->metadata ?: null,
        ]);
    }

    /**
     * Build without persisting (returns array for manual creation).
     */
    public function buildArray(): array
    {
        $this->validate();

        return [
            'video_id'            => $this->videoId,
            'uploader_type'       => $this->uploaderType,
            'uploader_id'         => $this->uploaderId,
            'r2_upload_id'        => $this->r2UploadId,
            'object_key'          => $this->objectKey,
            'declared_filename'   => $this->declaredFilename,
            'declared_mime'       => $this->declaredMime,
            'declared_size_bytes' => $this->declaredSizeBytes,
            'total_parts'         => $this->totalParts,
            'status'              => $this->status,
            'initiator_ip'        => $this->initiatorIp,
            'metadata'            => $this->metadata ?: null,
        ];
    }

    /**
     * Validate that all required fields are set.
     */
    private function validate(): void
    {
        $required = [
            'video_id' => $this->videoId,
            'uploader_type' => $this->uploaderType,
            'uploader_id' => $this->uploaderId,
            'r2_upload_id' => $this->r2UploadId,
            'object_key' => $this->objectKey,
        ];

        foreach ($required as $field => $value) {
            if ($value === null) {
                throw new \InvalidArgumentException("Missing required field: {$field}");
            }
        }
    }

    /**
     * Create a new builder instance.
     */
    public static function create(): self
    {
        return new self();
    }
}
