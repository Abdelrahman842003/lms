<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

use App\Notifications\Channels\FcmChannel;

class AdminNotification extends Notification
{
    use Queueable;

    public $title;
    public $message;
    public $senderName;
    public $senderRole;

    /**
     * Create a new notification instance.
     */
    public function __construct($title, $message, $senderName, $senderRole)
    {
        $this->title = $title;
        $this->message = $message;
        $this->senderName = $senderName;
        $this->senderRole = $senderRole;
    }

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
            'title' => $this->title,
            'message' => $this->message,
            'sender_name' => $this->senderName,
            'sender_role' => $this->senderRole,
        ];
    }
}
