<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StudentAbsentNotification extends Notification
{
    use Queueable;

    protected $lectureTitle;
    protected $teacherName;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct($lectureTitle, $teacherName)
    {
        $this->lectureTitle = $lectureTitle;
        $this->teacherName = $teacherName;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'title' => 'تسجيل غياب',
            'message' => "لقد تم تسجيلك غائب في محاضرة: {$this->lectureTitle} للمدرس {$this->teacherName}",
            'type' => 'absent',
            'lecture_title' => $this->lectureTitle,
            'teacher_name' => $this->teacherName,
        ];
    }
}
