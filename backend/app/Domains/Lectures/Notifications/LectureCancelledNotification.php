<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Notifications;

use App\Domains\Notifications\Services\NotificationSettingsService;
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

    public function via(object $notifiable): array
    {
        return app(NotificationSettingsService::class)->channelsFor(
            $notifiable,
            ['database'],
            false
        );
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
