<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Broadcasting\PrivateChannel;

class StudentAbsentNotification extends Notification implements ShouldBroadcast
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
        return ['database', 'broadcast', \App\Notifications\Channels\FcmChannel::class];
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

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->id),
        ];
    }
}
