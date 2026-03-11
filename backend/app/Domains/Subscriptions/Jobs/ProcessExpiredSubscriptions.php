<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Jobs;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Events\SubscriptionExpired;
use App\Domains\Subscriptions\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * يعالج الاشتراكات المنتهية → يُغيّر status إلى expired ويُطلق Event.
 * يُشغَّل يومياً من Scheduler.
 */
class ProcessExpiredSubscriptions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // الاشتراكات النشطة التي انتهى شهرها (month < الشهر الحالي)
        Subscription::query()
            ->where('status', SubscriptionStatus::PAID->value)
            ->whereNotNull('month')
            ->where('month', '<', now()->startOfMonth()->toDateString())
            ->with('subscriber')
            ->get()
            ->each(function (Subscription $sub): void {
                $subscriber = $sub->subscriber;
                if (! $subscriber) {
                    return;
                }

                // لا نُنهي اشتراكات الـ trial تلقائياً - تُدار بواسطة plan_expires_at
                if ($subscriber->plan_type === 'trial') {
                    return;
                }

                $subscriberType = match (true) {
                    $subscriber instanceof Teacher => 'teacher',
                    $subscriber instanceof Academy => 'academy',
                    default                        => 'unknown',
                };

                event(new SubscriptionExpired(
                    subscriber:     $subscriber,
                    subscriberType: $subscriberType,
                ));

                // تحديث الـ status لمنع المعالجة المكررة
                $sub->update(['status' => SubscriptionStatus::EXPIRED->value]);
            });
    }
}
