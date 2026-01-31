<?php

declare(strict_types=1);

namespace App\Interfaces;

use Illuminate\Support\Collection;
interface NotificationChannelInterface
{
    /**
     * Send a notification to the given recipients.
     *
     * @param Collection $recipients
     * @param string $title
     * @param string $message
     * @param array $data Additional data for the notification
     * @return void
     */
    public function send(Collection $recipients, string $title, string $message, array $data = []): void;
}
