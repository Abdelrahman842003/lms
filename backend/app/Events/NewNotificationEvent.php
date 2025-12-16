<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewNotificationEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $notificationId;
    public string $title;
    public string $message;
    public array $data;
    public string $type;
    public string $createdAt;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public string $userId,
        public string $userType, // 'student', 'teacher', 'admin', etc.
        string $notificationId,
        string $title,
        string $message,
        array $data = [],
        string $type = 'general'
    ) {
        $this->notificationId = $notificationId;
        $this->title = $title;
        $this->message = $message;
        $this->data = $data;
        $this->type = $type;
        $this->createdAt = now()->toISOString();
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Private channel for each user based on their type and ID
        return [
            new PrivateChannel("notifications.{$this->userType}.{$this->userId}"),
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
            'notification_id' => $this->notificationId,
            'title' => $this->title,
            'message' => $this->message,
            'data' => $this->data,
            'type' => $this->type,
            'created_at' => $this->createdAt,
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
