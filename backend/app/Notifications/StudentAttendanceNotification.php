<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\FcmChannel;

class StudentAttendanceNotification extends Notification
{
    use Queueable;

    public $lectureTitle;
    public $teacherName;

    /**
     * Create a new notification instance.
     */
    public function __construct($lectureTitle, $teacherName)
    {
        $this->lectureTitle = $lectureTitle;
        $this->teacherName = $teacherName;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'تم تسجيل الحضور بنجاح',
            'message' => "تم تسجيل حضورك في محاضرة: {$this->lectureTitle}",
            'sender_name' => $this->teacherName,
            'type' => 'attendance',
            'lecture_title' => $this->lectureTitle,
        ];
    }
}
