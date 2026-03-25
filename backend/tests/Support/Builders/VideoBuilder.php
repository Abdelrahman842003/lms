<?php

declare(strict_types=1);

namespace Tests\Support\Builders;

use App\Domains\Videos\DTOs\VideoActorContext;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Models\Video;
use Illuminate\Support\Str;

/**
 * Builder for creating Video model instances.
 * 
 * Provides a fluent interface for constructing videos
 * with many optional parameters and sensible defaults.
 * 
 * @see https://refactoring.guru/design-patterns/builder
 */
class VideoBuilder
{
    private ?string $ownerType = null;
    private ?string $ownerId = null;
    private ?string $uploaderType = null;
    private ?string $uploaderId = null;
    private ?string $teacherReferenceId = null;
    private ?string $teacherReferenceName = null;
    private ?string $academyId = null;
    private ?string $gradeId = null;
    private ?string $lectureId = null;
    private ?string $lessonId = null;
    private string $title = '';
    private ?string $description = null;
    private string $status = VideoStatus::DRAFT;
    private string $processingStatus = VideoProcessingStatus::PENDING;
    private ?string $scheduledAt = null;
    private ?string $availableFrom = null;
    private ?string $availableUntil = null;
    private ?string $originalPath = null;
    private ?string $videoMime = null;
    private int $videoSizeBytes = 0;
    private array $groupIds = [];
    private bool $isPublic = false;

    /**
     * Set the owner context from VideoActorContext.
     */
    public function withContext(VideoActorContext $context): self
    {
        $this->ownerType = $context->ownerType;
        $this->ownerId = $context->ownerId;
        $this->uploaderType = $context->uploaderMorphType();
        $this->uploaderId = $context->uploaderId;
        $this->academyId = $context->academyId;
        
        if ($context->teacherReference) {
            $this->teacherReferenceId = $context->teacherReference->id;
            $this->teacherReferenceName = $context->teacherReference->name;
        }
        
        return $this;
    }

    /**
     * Set the owner details.
     */
    public function ownedBy(string $type, string $id): self
    {
        $this->ownerType = $type;
        $this->ownerId = $id;
        return $this;
    }

    /**
     * Set the uploader details.
     */
    public function uploadedBy(string $type, string $id): self
    {
        $this->uploaderType = $type;
        $this->uploaderId = $id;
        return $this;
    }

    /**
     * Set the teacher reference.
     */
    public function withTeacher(string $id, string $name): self
    {
        $this->teacherReferenceId = $id;
        $this->teacherReferenceName = $name;
        return $this;
    }

    /**
     * Set the academy.
     */
    public function forAcademy(string $academyId): self
    {
        $this->academyId = $academyId;
        return $this;
    }

    /**
     * Set the grade.
     */
    public function forGrade(string $gradeId): self
    {
        $this->gradeId = $gradeId;
        return $this;
    }

    /**
     * Set the lecture.
     */
    public function forLecture(string $lectureId): self
    {
        $this->lectureId = $lectureId;
        return $this;
    }

    /**
     * Set the lesson.
     */
    public function forLesson(string $lessonId): self
    {
        $this->lessonId = $lessonId;
        return $this;
    }

    /**
     * Set the title.
     */
    public function titled(string $title): self
    {
        $this->title = $title;
        return $this;
    }

    /**
     * Set the description.
     */
    public function describedAs(string $description): self
    {
        $this->description = $description;
        return $this;
    }

    /**
     * Set the status.
     */
    public function withStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }

    /**
     * Mark as draft.
     */
    public function asDraft(): self
    {
        $this->status = VideoStatus::DRAFT;
        return $this;
    }

    /**
     * Mark as uploading.
     */
    public function asUploading(): self
    {
        $this->status = VideoStatus::UPLOADING;
        return $this;
    }

    /**
     * Mark as processing.
     */
    public function asProcessing(): self
    {
        $this->status = VideoStatus::PROCESSING;
        $this->processingStatus = VideoProcessingStatus::PROCESSING;
        return $this;
    }

    /**
     * Mark as ready.
     */
    public function asReady(): self
    {
        $this->status = VideoStatus::READY;
        $this->processingStatus = VideoProcessingStatus::COMPLETED;
        return $this;
    }

    /**
     * Mark as published.
     */
    public function asPublished(): self
    {
        $this->status = VideoStatus::PUBLISHED;
        return $this;
    }

    /**
     * Set the processing status.
     */
    public function withProcessingStatus(string $status): self
    {
        $this->processingStatus = $status;
        return $this;
    }

    /**
     * Set the scheduled date.
     */
    public function scheduledFor(string $datetime): self
    {
        $this->scheduledAt = $datetime;
        return $this;
    }

    /**
     * Set availability window.
     */
    public function availableFrom(string $datetime): self
    {
        $this->availableFrom = $datetime;
        return $this;
    }

    /**
     * Set availability end.
     */
    public function availableUntil(string $datetime): self
    {
        $this->availableUntil = $datetime;
        return $this;
    }

    /**
     * Set full availability window.
     */
    public function availableDuring(?string $from, ?string $until): self
    {
        $this->availableFrom = $from;
        $this->availableUntil = $until;
        return $this;
    }

    /**
     * Set the file information.
     */
    public function withFile(string $path, string $mime, int $sizeBytes): self
    {
        $this->originalPath = $path;
        $this->videoMime = $mime;
        $this->videoSizeBytes = $sizeBytes;
        return $this;
    }

    /**
     * Set the storage path.
     */
    public function storedAt(string $path): self
    {
        $this->originalPath = $path;
        return $this;
    }

    /**
     * Set the MIME type.
     */
    public function withMime(string $mime): self
    {
        $this->videoMime = $mime;
        return $this;
    }

    /**
     * Set the file size.
     */
    public function withSize(int $sizeBytes): self
    {
        $this->videoSizeBytes = $sizeBytes;
        return $this;
    }

    /**
     * Set the groups this video is assigned to.
     */
    public function forGroups(array $groupIds): self
    {
        $this->groupIds = $groupIds;
        return $this;
    }

    /**
     * Add a group.
     */
    public function addGroup(string $groupId): self
    {
        $this->groupIds[] = $groupId;
        return $this;
    }

    /**
     * Mark as public.
     */
    public function makePublic(): self
    {
        $this->isPublic = true;
        return $this;
    }

    /**
     * Mark as private.
     */
    public function makePrivate(): self
    {
        $this->isPublic = false;
        return $this;
    }

    /**
     * Build and persist the Video model.
     */
    public function build(): Video
    {
        $this->validate();

        $video = Video::query()->create([
            'owner_type'             => $this->ownerType,
            'owner_id'               => $this->ownerId,
            'uploader_type'          => $this->uploaderType,
            'uploader_id'            => $this->uploaderId,
            'teacher_reference_id'   => $this->teacherReferenceId,
            'teacher_reference_name' => $this->teacherReferenceName,
            'academy_id'             => $this->academyId,
            'grade_id'               => $this->gradeId,
            'lecture_id'             => $this->lectureId,
            'lesson_id'              => $this->lessonId,
            'title'                  => $this->title,
            'description'            => $this->description,
            'status'                 => $this->status,
            'processing_status'      => $this->processingStatus,
            'scheduled_at'           => $this->scheduledAt,
            'available_from'         => $this->availableFrom,
            'available_until'        => $this->availableUntil,
            'original_path'          => $this->originalPath,
            'video_mime'             => $this->videoMime,
            'video_size_bytes'       => $this->videoSizeBytes,
            'is_public'              => $this->isPublic,
        ]);

        if (!empty($this->groupIds)) {
            $video->groups()->sync(array_unique($this->groupIds));
        }

        return $video;
    }

    /**
     * Build without persisting (returns array for manual creation).
     */
    public function buildArray(): array
    {
        $this->validate();

        return [
            'owner_type'             => $this->ownerType,
            'owner_id'               => $this->ownerId,
            'uploader_type'          => $this->uploaderType,
            'uploader_id'            => $this->uploaderId,
            'teacher_reference_id'   => $this->teacherReferenceId,
            'teacher_reference_name' => $this->teacherReferenceName,
            'academy_id'             => $this->academyId,
            'grade_id'               => $this->gradeId,
            'lecture_id'             => $this->lectureId,
            'lesson_id'              => $this->lessonId,
            'title'                  => $this->title,
            'description'            => $this->description,
            'status'                 => $this->status,
            'processing_status'      => $this->processingStatus,
            'scheduled_at'           => $this->scheduledAt,
            'available_from'         => $this->availableFrom,
            'available_until'        => $this->availableUntil,
            'original_path'          => $this->originalPath,
            'video_mime'             => $this->videoMime,
            'video_size_bytes'       => $this->videoSizeBytes,
            'is_public'              => $this->isPublic,
        ];
    }

    /**
     * Validate that all required fields are set.
     */
    private function validate(): void
    {
        if (empty($this->title)) {
            throw new \InvalidArgumentException('Video title is required');
        }

        $required = [
            'owner_type' => $this->ownerType,
            'owner_id' => $this->ownerId,
            'uploader_type' => $this->uploaderType,
            'uploader_id' => $this->uploaderId,
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
