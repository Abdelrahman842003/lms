<?php

declare(strict_types=1);

namespace App\Factories;

use App\Interfaces\NotificationChannelInterface;
use App\Services\Notifications\Channels\DatabaseChannelStrategy;
use App\Services\Notifications\Channels\FcmChannelStrategy;
use InvalidArgumentException;

class NotificationFactory
{
    public static function make(string $channel = 'database'): NotificationChannelInterface
    {
        return match ($channel) {
            'database' => new DatabaseChannelStrategy(),
            'fcm' => new FcmChannelStrategy(),
            // Future channels:
            // 'sms' => new SmsChannelStrategy(),
            // 'email' => new EmailChannelStrategy(),
            default => throw new InvalidArgumentException("Notification channel [{$channel}] is not supported."),
        };
    }
}
