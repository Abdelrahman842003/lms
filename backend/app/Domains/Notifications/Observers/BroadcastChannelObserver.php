<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Observers;

use App\Domains\Notifications\Events\NewNotificationEvent;
use App\Domains\Notifications\Events\NotificationSentEvent;
use Illuminate\Support\Facades\Log;

/**
 * Observer that broadcasts notifications via Reverb (WebSockets).
 * 
 * @see https://refactoring.guru/design-patterns/observer
 */
class BroadcastChannelObserver implements NotificationChannelObserverInterface
{
    /**
     * Handle the notification sent event by broadcasting via Reverb.
     */
    public function handle(NotificationSentEvent $event): void
    {
        if (!$this->shouldHandle($event)) {
            return;
        }

        try {
            broadcast(new NewNotificationEvent(
                userId: (string) $event->getNotifiableId(),
                userType: $event->userType,
                notificationId: $event->notificationId,
                title: $event->title,
                message: $event->message,
                data: $event->data,
                type: $event->type,
            ));

            Log::info('Notification broadcast via Reverb', [
                'notification_id' => $event->notificationId,
                'user_type'       => $event->userType,
                'user_id'         => $event->getNotifiableId(),
            ]);
        } catch (\Exception $e) {
            Log::error('Reverb broadcast failed: ' . $e->getMessage(), [
                'notification_id' => $event->notificationId,
            ]);
        }
    }

    /**
     * Check if this observer should handle the event.
     */
    public function shouldHandle(NotificationSentEvent $event): bool
    {
        return $event->wasSentVia('broadcast');
    }
}
