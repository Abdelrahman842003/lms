<?php

declare(strict_types=1);

namespace App\Domains\Auth\Notifications;

use App\Domains\Notifications\Services\NotificationSettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Notification;

class TeacherNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public $title;
    public $message;
    public $senderName;
    public $senderAvatar;
    public $senderSubject;

    /**
     * Create a new notification instance.
     */
    public function __construct($title, $message, $senderName, $senderAvatar, $senderSubject = null)
    {
        $this->title = $title;
        $this->message = $message;
        $this->senderName = $senderName;
        $this->senderAvatar = $senderAvatar;
        $this->senderSubject = $senderSubject;
    }

    public function via(object $notifiable): array
    {
        return app(NotificationSettingsService::class)->channelsFor(
            $notifiable,
            ['database', 'broadcast'],
            true
        );
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
            'sender_avatar' => $this->senderAvatar,
            'sender_subject' => $this->senderSubject,
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
            new \Illuminate\Broadcasting\PrivateChannel('App.Models.User.' . $this->id),
        ];
    }
}
