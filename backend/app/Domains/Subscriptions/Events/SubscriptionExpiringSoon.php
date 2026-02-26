<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق قبل انتهاء الاشتراك بـ 7 أيام.
 */
class SubscriptionExpiringSoon
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Model  $subscriber,
        public readonly int    $daysLeft,
        public readonly string $subscriberType, // 'teacher' | 'academy'
    ) {}
}
