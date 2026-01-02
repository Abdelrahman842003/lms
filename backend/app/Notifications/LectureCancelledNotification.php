<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LectureCancelledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $lectureTitle;
    protected $teacherName;

    public function __construct($lectureTitle, $teacherName)
    {
        $this->lectureTitle = $lectureTitle;
        $this->teacherName = $teacherName;
    }

    public function via($notifiable)
    {
        return ['database']; // Add 'fcm' or other channels if needed
    }

    public function toArray($notifiable)
    {
        return [
            'title' => 'تم إلغاء المحاضرة',
            'body' => "تم إلغاء محاضرة {$this->lectureTitle} بواسطة الأستاذ {$this->teacherName}",
            'type' => 'lecture_cancelled',
        ];
    }
}
