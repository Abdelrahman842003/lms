<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LectureCancelledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected string $lectureTitle,
        protected string $teacherName,
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => 'تم إلغاء المحاضرة',
            'body'  => "تم إلغاء محاضرة {$this->lectureTitle} بواسطة الأستاذ {$this->teacherName}",
            'type'  => 'lecture_cancelled',
        ];
    }
}
