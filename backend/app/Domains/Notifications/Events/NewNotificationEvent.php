<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Events;

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
    public array  $data;
    public string $type;
    public string $createdAt;

    public function __construct(
        public string $userId,
        public string $userType,
        string $notificationId,
        string $title,
        string $message,
        array $data = [],
        string $type = 'general',
    ) {
        $this->notificationId = $notificationId;
        $this->title          = $title;
        $this->message        = $message;
        $this->data           = $data;
        $this->type           = $type;
        $this->createdAt      = now()->toISOString();
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("notifications.{$this->userType}.{$this->userId}"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'title'           => $this->title,
            'message'         => $this->message,
            'data'            => $this->data,
            'type'            => $this->type,
            'created_at'      => $this->createdAt,
        ];
    }

    public function broadcastAs(): string
    {
        return 'new.notification';
    }
}
