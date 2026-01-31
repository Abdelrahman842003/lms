<?php

declare(strict_types=1);

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
        $channels = ['database', 'broadcast'];

        // Only send FCM (Push) for attendance and exams
        if (in_array($this->type, ['absent', 'exam_result'])) {
            $channels[] = FcmChannel::class;
        }

        return $channels;
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
     * Get the FCM representation of the notification.
     */
    public function toFcm(object $notifiable): array
    {
        $message = $this->message;

        // Ensure Teacher name is in the message for exams if not already
        if ($this->type === 'exam_result' && !str_contains($message, $this->senderName)) {
            $message .= "\nالمدرس: " . $this->senderName;
        }

        // Ensure Student name is in the message if not already (usually is, but good to be safe)
        if ($this->childName && !str_contains($message, $this->childName)) {
            $message = "الطالب: " . $this->childName . "\n" . $message;
        }

        return [
            'title' => $this->title,
            'message' => $message,
            'data' => $this->toArray($notifiable)
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
