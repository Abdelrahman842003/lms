<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\DTOs\CreateVideoData;
use App\Domains\Videos\DTOs\UpdateVideoData;
use App\Domains\Videos\DTOs\VideoActorContext;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Jobs\ProcessUploadedVideoJob;
use App\Domains\Videos\Jobs\PublishScheduledVideoJob;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAttachment;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class VideoLifecycleService
{
    public function __construct(
        private readonly VideoStorageService $storage,
        private readonly VideoAccessGrantService $accessGrantService,
        private readonly VideoNotificationService $notifications,
        private readonly VideoReminderService $reminders,
        private readonly VideoSettingsService $videoSettings,
    ) {}

    /**
     * @param array<string, mixed> $filters
     */
    public function listForOwner(VideoActorContext $context, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Video::query()
            ->with(['grade', 'groups', 'teacherReference'])
            ->withCount(['likes', 'comments', 'attachments', 'watchProgresses'])
            ->where('owner_type', $context->ownerType->value)
            ->where('owner_id', $context->ownerId)
            ->latest();

        $this->applyFilters($query, $filters);

        return $query->paginate($perPage);
    }

    public function createVideo(CreateVideoData $data, VideoActorContext $context): Video
    {
        $this->assertPlanVideoConstraints($data, $context);

        return DB::transaction(function () use ($data, $context): Video {
            $video = Video::query()->create([
                'owner_type' => $context->ownerType,
                'owner_id' => $context->ownerId,
                'uploader_type' => $context->uploaderMorphType(),
                'uploader_id' => $context->uploaderId(),
                'teacher_reference_id' => $data->teacherReferenceId ?? $context->teacherReference?->id,
                'teacher_reference_name' => $data->teacherReferenceName ?? $context->teacherReference?->name,
                'academy_id' => $context->academyId,
                'grade_id' => $data->gradeId,
                'lecture_id' => $data->lectureId,
                'lesson_id' => $data->lessonId,
                'title' => $data->title,
                'description' => $data->description,
                'status' => VideoStatus::UPLOADING,
                'processing_status' => VideoProcessingStatus::PENDING,
                'scheduled_at' => $data->scheduledAt,
                'available_from' => $data->availableFrom,
                'available_until' => $data->availableUntil,
            ]);

            $video->groups()->sync($data->groupIds);

            $originalPath = $this->storage->uploadOriginal($video, $data->videoFile);

            $video->update([
                'original_path' => $originalPath,
                'video_mime' => $data->videoFile->getMimeType(),
                'video_size_bytes' => $data->videoFile->getSize(),
                'status' => VideoStatus::UPLOADED,
            ]);

            foreach ($data->attachments as $attachment) {
                $path = $this->storage->uploadAttachment($video, $attachment);

                VideoAttachment::query()->create([
                    'video_id' => $video->id,
                    'title' => pathinfo($attachment->getClientOriginalName(), PATHINFO_FILENAME),
                    'file_name' => $attachment->getClientOriginalName(),
                    'file_path' => $path,
                    'mime_type' => (string) $attachment->getMimeType(),
                    'file_size' => (int) $attachment->getSize(),
                    'uploaded_by_type' => $context->uploaderMorphType(),
                    'uploaded_by_id' => $context->uploaderId(),
                ]);
            }

            ProcessUploadedVideoJob::dispatch($video->id);

            $this->logActivity('video.uploaded', $video, $context->uploader, [
                'status' => $video->status->value,
                'group_ids' => $data->groupIds,
            ]);

            return $video->fresh(['groups', 'attachments', 'grade', 'teacherReference']);
        });
    }

    public function updateVideo(Video $video, UpdateVideoData $data, object $actor): Video
    {
        if ($video->status === VideoStatus::PROCESSING) {
            throw new AuthorizationException('لا يمكن تعديل الفيديو أثناء المعالجة.');
        }

        return DB::transaction(function () use ($video, $data, $actor): Video {
            $video->update($data->attributes);

            if ($data->groupIds !== null) {
                $video->groups()->sync($data->groupIds);
            }

            $this->logActivity('video.updated', $video, $actor, [
                'attributes' => array_keys($data->attributes),
                'groups_updated' => $data->groupIds !== null,
            ]);

            return $video->fresh(['groups', 'attachments', 'grade', 'teacherReference']);
        });
    }

    public function markProcessing(Video $video): void
    {
        $video->update([
            'status' => VideoStatus::PROCESSING,
            'processing_status' => VideoProcessingStatus::RUNNING,
            'processing_error' => null,
        ]);
    }

    /**
     * @param array<string, mixed> $meta
     */
    public function markProcessed(Video $video, array $meta): void
    {
        $video->update([
            'status' => VideoStatus::READY,
            'processing_status' => VideoProcessingStatus::SUCCEEDED,
            'processed_path' => $meta['processed_path'],
            'thumbnail_path' => $meta['thumbnail_path'],
            'video_mime' => $meta['video_mime'] ?? 'video/mp4',
            'video_size_bytes' => $meta['video_size_bytes'] ?? null,
            'duration_seconds' => $meta['duration_seconds'] ?? null,
            'width' => $meta['width'] ?? null,
            'height' => $meta['height'] ?? null,
            'codec' => $meta['codec'] ?? null,
            'frame_rate' => $meta['frame_rate'] ?? null,
            'processing_error' => null,
        ]);

        // Remove original as soon as processing succeeds.
        $this->storage->deleteIfExists($video->original_path);
        $video->update(['original_path' => null]);

        $this->preparePublication($video->fresh());
    }

    public function markFailed(Video $video, string $error): void
    {
        $video->update([
            'status' => VideoStatus::FAILED,
            'processing_status' => VideoProcessingStatus::FAILED,
            'processing_error' => $error,
        ]);

        $this->logActivity('video.processing_failed', $video, auth()->user(), [
            'error' => $error,
        ]);
    }

    public function retryProcessing(Video $video): void
    {
        if (! in_array($video->status, [VideoStatus::FAILED, VideoStatus::UPLOADED], true)) {
            throw new AuthorizationException('لا يمكن إعادة معالجة الفيديو في حالته الحالية.');
        }

        $video->update([
            'status' => VideoStatus::UPLOADED,
            'processing_status' => VideoProcessingStatus::PENDING,
            'processing_error' => null,
        ]);

        ProcessUploadedVideoJob::dispatch($video->id);
    }

    public function publish(Video $video, object $actor): Video
    {
        if (! in_array($video->status, [VideoStatus::READY, VideoStatus::SCHEDULED, VideoStatus::PUBLISHED], true)) {
            throw new AuthorizationException('لا يمكن نشر الفيديو قبل جاهزية المعالجة.');
        }

        if (! $video->processed_path) {
            throw new AuthorizationException('لا يمكن نشر فيديو بدون نسخة معالجة.');
        }

        $video->update([
            'status' => VideoStatus::PUBLISHED,
            'published_at' => now(),
            'published_by_type' => isset($actor->id) && $actor->id ? $this->resolveMorphType($actor) : null,
            'published_by_id' => isset($actor->id) && $actor->id ? (string) $actor->id : null,
        ]);

        $grants = $this->accessGrantService->createPublicationGrants($video->fresh(['groups']));
        $this->notifications->sendPublishedNotifications($video, $grants);

        $this->logActivity('video.published', $video, $actor, [
            'grants_count' => $grants->count(),
        ]);

        return $video->fresh(['groups', 'attachments', 'grade', 'teacherReference']);
    }

    public function delete(Video $video, object $actor): void
    {
        $this->reminders->stopForVideo($video, 'video_deleted');
        $video->update(['status' => VideoStatus::DELETED]);
        $video->delete();

        $this->logActivity('video.deleted', $video, $actor);
    }

    public function forceDelete(Video $video, object $actor): void
    {
        $this->reminders->stopForVideo($video, 'video_force_deleted');
        $this->storage->deleteIfExists($video->original_path);
        $this->storage->deleteIfExists($video->processed_path);
        $this->storage->deleteIfExists($video->thumbnail_path);

        foreach ($video->attachments as $attachment) {
            $this->storage->deleteIfExists($attachment->file_path);
        }

        $video->forceDelete();

        $this->logActivity('video.force_deleted', $video, $actor);
    }

    public function preparePublication(Video $video): void
    {
        if ($video->scheduled_at && $video->scheduled_at->isFuture()) {
            $video->update(['status' => VideoStatus::SCHEDULED]);
            PublishScheduledVideoJob::dispatch($video->id)->delay($video->scheduled_at);
        }
    }

    /**
     * @param array<string, mixed> $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['grade_id'])) {
            $query->where('grade_id', $filters['grade_id']);
        }

        if (! empty($filters['group_id'])) {
            $query->whereHas('groups', fn ($q) => $q->where('groups.id', $filters['group_id']));
        }

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['published_from'])) {
            $query->whereDate('published_at', '>=', $filters['published_from']);
        }

        if (! empty($filters['published_to'])) {
            $query->whereDate('published_at', '<=', $filters['published_to']);
        }
    }

    /**
     * @param array<string, mixed> $extra
     */
    private function logActivity(string $description, Video $video, ?object $actor, array $extra = []): void
    {
        try {
            activity('videos')
                ->causedBy($actor)
                ->performedOn($video)
                ->withProperties($extra)
                ->event($description)
                ->log($description);
        } catch (\Throwable) {
            // Keep the main flow resilient if activity log package is unavailable.
        }
    }

    private function resolveMorphType(object $actor): string
    {
        if (method_exists($actor, 'getMorphClass')) {
            /** @var string $morphClass */
            $morphClass = $actor->getMorphClass();
            return $morphClass;
        }

        return $actor::class;
    }

    private function assertPlanVideoConstraints(CreateVideoData $data, VideoActorContext $context): void
    {
        $this->assertPlanVideoConstraintsForDeclaredSize($context, max(0, (int) ($data->videoFile->getSize() ?? 0)));
    }

    /**
     * Public entry-point used by the new direct-upload orchestration service,
     * which has the declared file size but no UploadedFile object.
     */
    public function assertPlanVideoConstraintsForDeclaredSize(VideoActorContext $context, int $incomingBytes): void
    {
        $entitlements = $this->resolveOwnerEntitlements($context);

        $globalUploadLimitBytes = $this->mbToBytes($this->videoSettings->videoMaxSizeMb());
        $planUploadLimitBytes = null;
        if (isset($entitlements['max_video_upload_size_mb'])) {
            $planUploadLimitBytes = $this->mbToBytes((int) $entitlements['max_video_upload_size_mb']);
        }

        $effectiveUploadLimitBytes = $planUploadLimitBytes !== null
            ? min($globalUploadLimitBytes, $planUploadLimitBytes)
            : $globalUploadLimitBytes;

        if ($effectiveUploadLimitBytes > 0 && $incomingBytes > $effectiveUploadLimitBytes) {
            $effectiveUploadLimitMb = (int) floor($effectiveUploadLimitBytes / (1024 * 1024));
            throw new AuthorizationException("حجم الفيديو يتجاوز الحد المسموح به للباقتك ({$effectiveUploadLimitMb} MB).");
        }

        if (! isset($entitlements['video_storage_gb'])) {
            return;
        }

        $storageLimitBytes = $this->gbToBytes((int) $entitlements['video_storage_gb']);
        if ($storageLimitBytes <= 0) {
            return;
        }

        $currentUsageBytes = (int) Video::query()
            ->where('owner_type', $context->ownerType->value)
            ->where('owner_id', $context->ownerId)
            ->sum('video_size_bytes');

        if (($currentUsageBytes + $incomingBytes) > $storageLimitBytes) {
            $limitGb = (int) $entitlements['video_storage_gb'];
            throw new AuthorizationException("تجاوزت السعة التخزينية المسموحة للفيديو في باقتك ({$limitGb} GB).");
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function resolveOwnerEntitlements(VideoActorContext $context): array
    {
        $owner = null;

        if ($context->ownerType === VideoOwnerType::ACADEMY) {
            $owner = Academy::query()->find($context->ownerId);
        } elseif ($context->ownerType === VideoOwnerType::INDEPENDENT_TEACHER) {
            $owner = Teacher::query()->find($context->ownerId);
        }

        $entitlements = is_array($owner?->plan_entitlements) ? $owner->plan_entitlements : [];

        return $entitlements;
    }

    private function mbToBytes(int $value): int
    {
        return max(0, $value) * 1024 * 1024;
    }

    private function gbToBytes(int $value): int
    {
        return max(0, $value) * 1024 * 1024 * 1024;
    }
}
