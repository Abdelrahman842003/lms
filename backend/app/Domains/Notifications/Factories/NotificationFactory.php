<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Factories;

use App\Domains\Notifications\Contracts\NotificationChannelInterface;
use App\Domains\Notifications\Channels\DatabaseChannelStrategy;
use App\Domains\Notifications\Channels\FcmChannelStrategy;
use InvalidArgumentException;

class NotificationFactory
{
    public static function make(string $channel = 'database'): NotificationChannelInterface
    {
        return match ($channel) {
            'database' => new DatabaseChannelStrategy(),
            'fcm' => new FcmChannelStrategy(),
            default => throw new InvalidArgumentException("Notification channel [{$channel}] is not supported."),
        };
    }
}
