<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق عند انتهاء الاشتراك فعلياً.
 */
class SubscriptionExpired
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Model  $subscriber,
        public readonly string $subscriberType, // 'teacher' | 'academy'
    ) {}
}
