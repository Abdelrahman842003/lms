<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Broadcasting\PrivateChannel;
use App\Notifications\Channels\FcmChannel;

class ParentNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public $userId;
    public $title;
    public $message;
    public $senderName;
    public $childName;
    public $type;
    public $data;

    /**
     * Create a new notification instance.
     */
    public function __construct($userId, $title, $message, $senderName, $childName = null, $type = 'general', $data = [])
    {
        $this->userId = $userId;
        $this->title = $title;
        $this->message = $message;
        $this->senderName = $senderName;
        $this->childName = $childName;
        $this->type = $type;
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', FcmChannel::class];
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
            'child_name' => $this->childName,
            'type' => $this->type,
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
            new PrivateChannel('notifications.parent.' . $this->userId),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'data' => array_merge([
                'sender_name' => $this->senderName,
                'child_name' => $this->childName,
            ], $this->data),
            'created_at' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'new.notification';
    }
}
