<?php

declare(strict_types=1);

namespace App\Domains\Videos\Notifications;

use App\Domains\Videos\Models\Video;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class VideoMissedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Video $video,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'video_missed',
            'video_id' => $this->video->id,
            'title' => $this->video->title,
            'message' => 'لم تتم مشاهدة هذه المحاضرة بعد التذكيرات المطلوبة، يرجى المتابعة.',
        ];
    }
}
