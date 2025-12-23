<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\FcmChannel;

class LectureActivatedNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public $lectureTitle;
    public $teacherName;
    public $lectureId;

    /**
     * Create a new notification instance.
     */
    public function __construct($lectureTitle, $teacherName, $lectureId)
    {
        $this->lectureTitle = $lectureTitle;
        $this->teacherName = $teacherName;
        $this->lectureId = $lectureId;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class, 'broadcast'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'محاضرة جديدة متاحة',
            'message' => "تم تفعيل محاضرة: {$this->lectureTitle} بواسطة {$this->teacherName}",
            'sender_name' => $this->teacherName,
            'type' => 'lecture_activated',
            'lecture_id' => $this->lectureId,
            'lecture_title' => $this->lectureTitle,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): \Illuminate\Notifications\Messages\BroadcastMessage
    {
        return new \Illuminate\Notifications\Messages\BroadcastMessage([
            'title' => 'محاضرة جديدة متاحة',
            'message' => "تم تفعيل محاضرة: {$this->lectureTitle} بواسطة {$this->teacherName}",
            'sender_name' => $this->teacherName,
            'type' => 'lecture_activated',
            'lecture_id' => $this->lectureId,
            'lecture_title' => $this->lectureTitle,
        ]);
    }

    /**
     * Get the type of the notification being broadcast.
     */
    public function broadcastType(): string
    {
        return 'lecture_activated';
    }
}
