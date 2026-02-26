<?php

declare(strict_types=1);

namespace App\Domains\Auth\Notifications;

use App\Domains\Notifications\Channels\FcmChannelStrategy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Notification;

class AdminNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public $title;
    public $message;
    public $senderName;
    public $senderRole;
    public $data;

    /**
     * Create a new notification instance.
     */
    public function __construct($title, $message, $senderName, $senderRole, $data = [])
    {
        $this->title = $title;
        $this->message = $message;
        $this->senderName = $senderName;
        $this->senderRole = $senderRole;
        $this->data = $data;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', FcmChannelStrategy::class];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return array_merge([
            'title' => $this->title,
            'message' => $this->message,
            'sender_name' => $this->senderName,
            'sender_role' => $this->senderRole,
        ], $this->data);
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
