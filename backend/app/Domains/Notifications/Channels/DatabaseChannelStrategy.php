<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Channels;

use App\Domains\Auth\Notifications\AdminNotification;
use App\Domains\Notifications\Contracts\NotificationChannelInterface;
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
