<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Contracts;

use Illuminate\Support\Collection;

/**
 * Contract لقنوات الإشعارات (FCM / Database / ...).
 */
interface NotificationChannelInterface
{
    /**
     * @param  Collection  $recipients
     * @param  array<string, mixed>  $data
     */
    public function send(Collection $recipients, string $title, string $message, array $data = []): void;
}
