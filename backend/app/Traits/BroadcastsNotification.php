<?php

declare(strict_types=1);

namespace App\Traits;

use App\Events\NewNotificationEvent;
use Illuminate\Support\Str;

trait BroadcastsNotification
{
    /**
     * Broadcast the notification via Reverb for real-time delivery.
     * 
     * Call this in the notification class after sending to database.
     */
    public function broadcastViaReverb(object $notifiable, string $userType): void
    {
        $data = $this->toArray($notifiable);
        
        broadcast(new NewNotificationEvent(
            userId: (string) $notifiable->id,
            userType: $userType,
            notificationId: $this->id ?? Str::uuid()->toString(),
            title: $data['title'] ?? 'إشعار جديد',
            message: $data['message'] ?? '',
            data: $data,
            type: $data['type'] ?? 'general'
        ));
    }
}
