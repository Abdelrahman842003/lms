<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Observers;

use App\Domains\Notifications\Events\NotificationSentEvent;

/**
 * Interface for notification channel observers.
 * 
 * Implementations handle notification delivery through specific channels
 * (database, broadcast, FCM, etc.) in response to notification events.
 * 
 * @see https://refactoring.guru/design-patterns/observer
 */
interface NotificationChannelObserverInterface
{
    /**
     * Handle the notification sent event.
     *
     * @param NotificationSentEvent $event The notification event
     * @return void
     */
    public function handle(NotificationSentEvent $event): void;

    /**
     * Check if this observer should handle the given event.
     *
     * @param NotificationSentEvent $event
     * @return bool
     */
    public function shouldHandle(NotificationSentEvent $event): bool;
}
