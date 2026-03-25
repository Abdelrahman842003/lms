<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event dispatched before a notification is sent.
 * 
 * Allows listeners to modify notification data or prevent sending.
 * 
 * @see https://refactoring.guru/design-patterns/observer
 */
class NotificationSendingEvent
{
    use Dispatchable, SerializesModels;

    public bool $shouldSend = true;

    public function __construct(
        public readonly object $notifiable,
        public readonly string $userType,
        public string $title,
        public string $message,
        public array $data,
        public string $type,
        public bool $sendFcm,
    ) {}

    /**
     * Prevent the notification from being sent.
     */
    public function preventSending(): void
    {
        $this->shouldSend = false;
    }

    /**
     * Check if the notification should be sent.
     */
    public function shouldSend(): bool
    {
        return $this->shouldSend;
    }
}
