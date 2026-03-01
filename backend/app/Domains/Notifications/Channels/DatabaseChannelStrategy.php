<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Channels;

use App\Domains\Auth\Notifications\AdminNotification;
use App\Domains\Notifications\Services\NotificationSettingsService;
use App\Domains\Notifications\Contracts\NotificationChannelInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

class DatabaseChannelStrategy implements NotificationChannelInterface
{
    public function send(Collection $recipients, string $title, string $message, array $data = []): void
    {
        /** @var NotificationSettingsService $notificationSettings */
        $notificationSettings = app(NotificationSettingsService::class);
        $senderName = $data['sender_name'] ?? 'System';
        $senderRole = $data['sender_role'] ?? 'admin';
        $allowedRecipients = $notificationSettings->filterRecipients($recipients);

        if ($allowedRecipients->isEmpty()) {
            return;
        }

        $batchSize = $notificationSettings->maxBatchSize();

        foreach ($allowedRecipients->chunk($batchSize) as $recipientChunk) {
            Notification::send($recipientChunk, new AdminNotification(
                $title,
                $message,
                $senderName,
                $senderRole,
                $data
            ));
        }
    }
}
