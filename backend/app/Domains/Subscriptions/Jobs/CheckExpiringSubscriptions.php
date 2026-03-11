<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Jobs;

use App\Domains\Subscriptions\Events\SubscriptionExpiringSoon;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Enums\SubscriptionType;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

/**
 * يفحص الاشتراكات التي ستنتهي خلال 7 أيام ويُطلق تحذيرات.
 * يُشغَّل يومياً من Scheduler.
 *
 * @updated لاستخدام نموذج Subscription الموحد بدلاً من النماذج القديمة
 */
class CheckExpiringSubscriptions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private const WARNING_DAYS = 7;

    public function handle(): void
    {
        $this->checkSubscriptions(SubscriptionType::TEACHER);
        $this->checkSubscriptions(SubscriptionType::ACADEMY);
    }

    /**
     * فحص اشتراكات نوع معين (Teacher أو Academy)
     */
    private function checkSubscriptions(SubscriptionType $type): void
    {
        Subscription::query()
            ->where('subscriber_type', $type->value)
            ->where('status', SubscriptionStatus::PAID->value)
            ->whereNotNull('month')
            ->whereBetween('month', [
                now()->toDateString(),
                now()->addDays(self::WARNING_DAYS)->toDateString()
            ])
            ->with('subscriber')
            ->get()
            ->each(function (Subscription $sub) use ($type) {
                $subscriber = $sub->subscriber;
                if (!$subscriber) {
                    return;
                }

                // حساب الأيام المتبقية حتى نهاية الشهر
                $monthEnd = Carbon::parse($sub->month)->endOfMonth();
                $daysLeft = (int) now()->diffInDays($monthEnd, false);

                // إطلاق التحذير فقط إذا كان ضمن فترة التحذير
                if ($daysLeft <= self::WARNING_DAYS && $daysLeft >= 0) {
                    event(new SubscriptionExpiringSoon(
                        subscriber:     $subscriber,
                        daysLeft:       abs($daysLeft),
                        subscriberType: $type->value === SubscriptionType::TEACHER->value ? 'teacher' : 'academy',
                    ));
                }
            });
    }
}
