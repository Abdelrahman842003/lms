<?php

declare(strict_types=1);

namespace App\Domains\Auth\Notifications;

use App\Domains\Notifications\Services\NotificationSettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Notification;

class StudentNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public $data;

    /**
     * Create a new notification instance.
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return app(NotificationSettingsService::class)->channelsFor(
            $notifiable,
            ['database', 'broadcast'],
            false
        );
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return $this->data;
    }
}
