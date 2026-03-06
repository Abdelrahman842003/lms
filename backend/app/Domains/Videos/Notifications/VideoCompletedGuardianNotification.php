<?php

declare(strict_types=1);

namespace App\Domains\Videos\Notifications;

use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Models\Video;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class VideoCompletedGuardianNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Video $video,
        private readonly Student $student,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'video_completed_guardian',
            'video_id' => $this->video->id,
            'student_id' => $this->student->id,
            'student_name' => $this->student->name,
            'title' => $this->video->title,
            'message' => 'الطالب شاهد الفيديو التعليمي.',
        ];
    }
}
