<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Listeners;

use App\Domains\Notifications\Events\NotificationSentEvent;
use App\Domains\Notifications\Observers\NotificationChannelObserverInterface;
use Illuminate\Events\Dispatcher;

/**
 * Event subscriber that coordinates notification channel observers.
 * 
 * This class acts as the Subject in the Observer pattern, managing
 * a collection of observers and notifying them when notifications are sent.
 * 
 * Observers are injected via dependency injection using a tagged container,
 * which allows for loose coupling and easier testing.
 * 
 * @see https://refactoring.guru/design-patterns/observer
 */
class NotificationEventSubscriber
{
    /**
     * @var array<NotificationChannelObserverInterface>
     */
    private array $observers = [];

    /**
     * Create a new notification event subscriber.
     *
     * @param iterable<NotificationChannelObserverInterface> $observers Observers injected via DI container tag
     */
    public function __construct(iterable $observers = [])
    {
        foreach ($observers as $observer) {
            $this->registerObserver($observer);
        }
    }

    /**
     * Register a notification channel observer.
     */
    public function registerObserver(NotificationChannelObserverInterface $observer): void
    {
        $this->observers[] = $observer;
    }

    /**
     * Remove a notification channel observer.
     */
    public function removeObserver(NotificationChannelObserverInterface $observer): void
    {
        $this->observers = array_filter(
            $this->observers,
            fn($o) => $o !== $observer
        );
    }

    /**
     * Handle the notification sent event by notifying all observers.
     */
    public function handleNotificationSent(NotificationSentEvent $event): void
    {
        foreach ($this->observers as $observer) {
            if ($observer->shouldHandle($event)) {
                $observer->handle($event);
            }
        }
    }

    /**
     * Subscribe to notification events.
     */
    public function subscribe(Dispatcher $events): array
    {
        return [
            NotificationSentEvent::class => 'handleNotificationSent',
        ];
    }

    /**
     * Get all registered observers.
     *
     * @return array<NotificationChannelObserverInterface>
     */
    public function getObservers(): array
    {
        return $this->observers;
    }
}
