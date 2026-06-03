<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Jobs;

use App\Domains\Subscriptions\Events\SubscriptionExpiringSoon;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Academy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * يفحص الاشتراكات التي ستنتهي خلال 7 أو 3 أو 1 أيام ويُطلق تنبيهات الدفع.
 * يُشغَّل يومياً من Scheduler.
 */
class CheckExpiringSubscriptions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $days = [7, 3, 1];

        foreach ($days as $day) {
            $targetDate = now()->addDays($day)->toDateString();

            // المدرسين
            Teacher::query()
                ->whereDate('plan_expires_at', $targetDate)
                ->get()
                ->each(function (Teacher $teacher) use ($day) {
                    event(new SubscriptionExpiringSoon(
                        subscriber:     $teacher,
                        daysLeft:       $day,
                        subscriberType: 'teacher',
                    ));
                });

            // الأكاديميات
            Academy::query()
                ->whereDate('plan_expires_at', $targetDate)
                ->get()
                ->each(function (Academy $academy) use ($day) {
                    event(new SubscriptionExpiringSoon(
                        subscriber:     $academy,
                        daysLeft:       $day,
                        subscriberType: 'academy',
                    ));
                });
        }
    }
}
