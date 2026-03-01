<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Notifications;

use App\Domains\Notifications\Services\NotificationSettingsService;
use Illuminate\Broadcasting\BroadcastMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Notification;

class StudentAttendanceNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public string $lectureTitle,
        public string $teacherName,
    ) {}

    public function via(object $notifiable): array
    {
        return app(NotificationSettingsService::class)->channelsFor(
            $notifiable,
            ['database', 'broadcast'],
            true
        );
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title'         => 'تم تسجيل الحضور بنجاح',
            'message'       => "تم تسجيل حضورك في محاضرة: {$this->lectureTitle}",
            'sender_name'   => $this->teacherName,
            'type'          => 'attendance',
            'lecture_title' => $this->lectureTitle,
        ];
    }

    public function toBroadcast(object $notifiable): \Illuminate\Notifications\Messages\BroadcastMessage
    {
        return new \Illuminate\Notifications\Messages\BroadcastMessage($this->toArray($notifiable));
    }

    public function broadcastType(): string
    {
        return 'attendance';
    }
}
