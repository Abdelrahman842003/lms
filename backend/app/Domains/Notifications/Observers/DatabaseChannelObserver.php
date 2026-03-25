<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Observers;

use App\Domains\Notifications\Events\NotificationSentEvent;
use Illuminate\Support\Facades\Log;

/**
 * Observer that stores notifications in the database.
 * 
 * @see https://refactoring.guru/design-patterns/observer
 */
class DatabaseChannelObserver implements NotificationChannelObserverInterface
{
    /**
     * Handle the notification sent event by storing in database.
     */
    public function handle(NotificationSentEvent $event): void
    {
        if (!$this->shouldHandle($event)) {
            return;
        }

        try {
            $event->notifiable->notifications()->create([
                'id'   => $event->notificationId,
                'type' => 'App\\Notifications\\' . ucfirst($event->userType) . 'Notification',
                'data' => [
                    'title'   => $event->title,
                    'message' => $event->message,
                    'type'    => $event->type,
                    ...$event->data,
                ],
                'read_at' => null,
            ]);

            Log::info('Notification stored in database', [
                'notification_id' => $event->notificationId,
                'notifiable_type' => get_class($event->notifiable),
                'notifiable_id'   => $event->getNotifiableId(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to store notification in database: ' . $e->getMessage(), [
                'notification_id' => $event->notificationId,
            ]);
        }
    }

    /**
     * Check if this observer should handle the event.
     */
    public function shouldHandle(NotificationSentEvent $event): bool
    {
        return $event->wasSentVia('database');
    }
}
