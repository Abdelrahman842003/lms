<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Enums\VideoWatchStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoComment;
use App\Domains\Videos\Models\VideoLike;
use App\Domains\Videos\Models\VideoPlaybackToken;
use App\Domains\Videos\Models\VideoWatchProgress;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class VideoInteractionService
{
    public function __construct(
        private readonly VideoSettingsService $settings,
        private readonly VideoNotificationService $notifications,
        private readonly VideoReminderService $reminders,
    ) {}

    /**
     * @param array<string, mixed> $payload
     */
    public function updateProgress(Video $video, Student $student, array $payload): VideoWatchProgress
    {
        return DB::transaction(function () use ($video, $student, $payload): VideoWatchProgress {
            $durationSeconds = max(1, (int) ($video->duration_seconds ?? 1));
            $reportedWatchedSeconds = max(0, (int) ($payload['watched_seconds'] ?? 0));
            $reportedPosition = max(0, (int) ($payload['last_position_seconds'] ?? 0));

            $progress = VideoWatchProgress::query()->firstOrCreate(
                [
                    'video_id' => $video->id,
                    'student_id' => $student->id,
                ],
                [
                    'status' => VideoWatchStatus::NOT_STARTED,
                    'watched_seconds' => 0,
                    'watched_percentage' => 0,
                    'last_position_seconds' => 0,
                ]
            );

            $watchedSeconds = min($durationSeconds, max($progress->watched_seconds, $reportedWatchedSeconds));
            $lastPosition = min($durationSeconds, max($progress->last_position_seconds, $reportedPosition));
            $watchedPercentage = round(($watchedSeconds / $durationSeconds) * 100, 2);

            $startedThreshold = min(max(15, (int) floor($durationSeconds * 0.05)), max(30, (int) floor($durationSeconds * 0.2)));
            $completedThreshold = $this->settings->completedThresholdPercent();

            $status = VideoWatchStatus::NOT_STARTED;
            $startedAt = $progress->started_at;
            $completedAt = $progress->completed_at;

            if ($watchedPercentage >= $completedThreshold) {
                $status = VideoWatchStatus::COMPLETED;
                $startedAt = $startedAt ?? now();
                $completedAt = $completedAt ?? now();
            } elseif ($watchedSeconds >= $startedThreshold) {
                $status = $watchedPercentage >= 20
                    ? VideoWatchStatus::IN_PROGRESS
                    : VideoWatchStatus::STARTED;
                $startedAt = $startedAt ?? now();
                $completedAt = null;
            }

            $progress->update([
                'status' => $status,
                'started_at' => $startedAt,
                'last_watched_at' => now(),
                'completed_at' => $completedAt,
                'watched_seconds' => $watchedSeconds,
                'watched_percentage' => $watchedPercentage,
                'last_position_seconds' => $lastPosition,
                'last_playback_token_id' => isset($payload['playback_token_id']) ? (string) $payload['playback_token_id'] : $progress->last_playback_token_id,
            ]);

            if ($status !== VideoWatchStatus::NOT_STARTED) {
                $this->reminders->stopForStudent($video, $student, $status === VideoWatchStatus::COMPLETED ? 'completed' : 'started');
            }

            if ($status === VideoWatchStatus::COMPLETED && $progress->getOriginal('status') !== VideoWatchStatus::COMPLETED->value) {
                $this->notifications->sendCompletedToGuardian($student, $video);
            }

            return $progress->fresh();
        });
    }

    /**
     * @return array{liked:bool,likes_count:int}
     */
    public function toggleLike(Video $video, Student $student): array
    {
        $existing = VideoLike::query()
            ->where('video_id', $video->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            VideoLike::query()->create([
                'video_id' => $video->id,
                'student_id' => $student->id,
            ]);
            $liked = true;
        }

        return [
            'liked' => $liked,
            'likes_count' => VideoLike::query()->where('video_id', $video->id)->count(),
        ];
    }

    public function addComment(Video $video, object $author, string $body, ?string $parentId = null): VideoComment
    {
        $parent = null;

        if ($parentId) {
            $parent = VideoComment::query()
                ->where('video_id', $video->id)
                ->whereKey($parentId)
                ->first();

            if (! $parent) {
                throw new AuthorizationException('التعليق الأساسي غير موجود.');
            }
        }

        return VideoComment::query()->create([
            'video_id' => $video->id,
            'parent_id' => $parent?->id,
            'author_type' => $this->resolveMorphType($author),
            'author_id' => (string) $author->id,
            'body' => $body,
        ]);
    }

    public function hideComment(VideoComment $comment, object $actor): VideoComment
    {
        $comment->update([
            'is_hidden' => true,
            'hidden_by_type' => $this->resolveMorphType($actor),
            'hidden_by_id' => (string) $actor->id,
            'hidden_at' => now(),
        ]);

        return $comment->fresh();
    }

    public function deleteComment(VideoComment $comment): void
    {
        $comment->delete();
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
}
