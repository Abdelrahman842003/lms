<?php

declare(strict_types=1);

namespace App\Domains\Notifications;

use App\Domains\Notifications\Services\NotificationSettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

abstract class BaseNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    abstract protected function getData(): array;

    public function via(object $notifiable): array
    {
        return app(NotificationSettingsService::class)->channelsFor(
            $notifiable,
            ['database', 'broadcast'],
            true
        );
    }

    public function toArray(object $notifiable): array
    {
        return $this->getData();
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->getData());
    }
}
