<?php

namespace App\Services\Notifications\Channels;

use App\Interfaces\NotificationChannelInterface;
use App\Notifications\AdminNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

class DatabaseChannelStrategy implements NotificationChannelInterface
{
    public function send(Collection $recipients, string $title, string $message, array $data = []): void
    {
        $senderName = $data['sender_name'] ?? 'System';
        $senderRole = $data['sender_role'] ?? 'admin';

        Notification::send($recipients, new AdminNotification(
            $title,
            $message,
            $senderName,
            $senderRole,
            $data
        ));
    }
}
