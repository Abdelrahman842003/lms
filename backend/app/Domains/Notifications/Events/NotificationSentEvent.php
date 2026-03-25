<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event dispatched after a notification has been sent.
 * 
 * Allows listeners to perform post-send actions like logging,
 * analytics, or triggering additional workflows.
 * 
 * @see https://refactoring.guru/design-patterns/observer
 */
class NotificationSentEvent
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $notificationId,
        public readonly object $notifiable,
        public readonly string $userType,
        public readonly string $title,
        public readonly string $message,
        public readonly array $data,
        public readonly string $type,
        public readonly array $channels,
        public readonly bool $fcmSent,
    ) {}

    /**
     * Get the notifiable entity's ID.
     */
    public function getNotifiableId(): int|string
    {
        return $this->notifiable->id;
    }

    /**
     * Check if the notification was sent via a specific channel.
     */
    public function wasSentVia(string $channel): bool
    {
        return in_array($channel, $this->channels, true);
    }
}
