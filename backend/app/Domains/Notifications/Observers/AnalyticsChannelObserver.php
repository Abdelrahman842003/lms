<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Observers;

use App\Domains\Notifications\Events\NotificationSentEvent;
use Illuminate\Support\Facades\Log;

/**
 * Observer that tracks notification analytics and metrics.
 * 
 * Can be extended to integrate with analytics services like
 * Google Analytics, Mixpanel, or custom analytics solutions.
 * 
 * @see https://refactoring.guru/design-patterns/observer
 */
class AnalyticsChannelObserver implements NotificationChannelObserverInterface
{
    /**
     * Handle the notification sent event by tracking analytics.
     */
    public function handle(NotificationSentEvent $event): void
    {
        if (!$this->shouldHandle($event)) {
            return;
        }

        $this->trackNotificationSent($event);
    }

    /**
     * Check if this observer should handle the event.
     * Analytics observer handles all successful notifications.
     */
    public function shouldHandle(NotificationSentEvent $event): bool
    {
        return true;
    }

    /**
     * Track notification metrics.
     */
    protected function trackNotificationSent(NotificationSentEvent $event): void
    {
        $metrics = [
            'notification_id'   => $event->notificationId,
            'notifiable_type'   => get_class($event->notifiable),
            'notifiable_id'     => $event->getNotifiableId(),
            'user_type'         => $event->userType,
            'notification_type' => $event->type,
            'channels'          => $event->channels,
            'fcm_sent'          => $event->fcmSent,
            'sent_at'           => now()->toISOString(),
        ];

        // Log for now - can be extended to send to analytics service
        Log::info('Notification analytics tracked', $metrics);

        // Future: Send to analytics service
        // $this->analyticsService->track('notification_sent', $metrics);
    }
}
