<?php

declare(strict_types=1);

namespace App\Domains\Videos\Notifications;

use App\Domains\Videos\Models\Video;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class VideoReminderNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Video $video,
        private readonly int $attempt,
        private readonly int $maxAttempts,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'video_reminder',
            'video_id' => $this->video->id,
            'title' => $this->video->title,
            'attempt' => $this->attempt,
            'max_attempts' => $this->maxAttempts,
            'message' => 'تذكير: يوجد فيديو تعليمي لم يتم مشاهدته بعد.',
        ];
    }
}
