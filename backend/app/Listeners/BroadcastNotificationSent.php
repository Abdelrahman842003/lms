<?php

namespace App\Listeners;

use App\Events\NewNotificationEvent;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BroadcastNotificationSent
{
    /**
     * Handle the event.
     * 
     * This listener broadcasts all database notifications via Reverb for real-time delivery.
     */
    public function handle(NotificationSent $event): void
    {
        // Only broadcast database channel notifications
        if ($event->channel !== 'database') {
            return;
        }

        $notifiable = $event->notifiable;
        $notification = $event->notification;

        // Determine user type from class name
        $userType = strtolower(class_basename($notifiable));

        // Get notification data
        $data = method_exists($notification, 'toArray') 
            ? $notification->toArray($notifiable) 
            : [];

        // Notification ID (from database response or generate new)
        $notificationId = $event->response ?? Str::uuid()->toString();

        try {
            broadcast(new NewNotificationEvent(
                userId: (string) $notifiable->id,
                userType: $userType,
                notificationId: (string) $notificationId,
                title: $data['title'] ?? 'إشعار جديد',
                message: $data['message'] ?? '',
                data: $data,
                type: $data['type'] ?? 'general'
            ));

            Log::info("Reverb broadcast for {$userType}:{$notifiable->id}", [
                'notification_id' => $notificationId,
                'title' => $data['title'] ?? 'N/A',
            ]);
        } catch (\Exception $e) {
            Log::error("Reverb broadcast failed: " . $e->getMessage());
        }
    }
}
