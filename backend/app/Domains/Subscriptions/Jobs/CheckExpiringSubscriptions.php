<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Jobs;

use App\Domains\Subscriptions\Events\SubscriptionExpiringSoon;
use App\Domains\Subscriptions\Models\TeacherSubscription;
use App\Domains\Subscriptions\Models\AcademySubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * يفحص الاشتراكات التي ستنتهي خلال 7 أيام ويُطلق تحذيرات.
 * يُشغَّل يومياً من Scheduler.
 */
class CheckExpiringSubscriptions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $queue = 'default';

    private const WARNING_DAYS = 7;

    public function handle(): void
    {
        $this->checkTeacherSubscriptions();
        $this->checkAcademySubscriptions();
    }

    private function checkTeacherSubscriptions(): void
    {
        TeacherSubscription::query()
            ->where('status', 'active')
            ->whereBetween('ends_at', [now(), now()->addDays(self::WARNING_DAYS)])
            ->with('teacher')
            ->get()
            ->each(function (TeacherSubscription $sub) {
                $daysLeft = (int) now()->diffInDays($sub->ends_at);

                event(new SubscriptionExpiringSoon(
                    subscriber:     $sub->teacher,
                    daysLeft:       $daysLeft,
                    subscriberType: 'teacher',
                ));
            });
    }

    private function checkAcademySubscriptions(): void
    {
        AcademySubscription::query()
            ->where('status', 'active')
            ->whereBetween('ends_at', [now(), now()->addDays(self::WARNING_DAYS)])
            ->with('academy')
            ->get()
            ->each(function (AcademySubscription $sub) {
                $daysLeft = (int) now()->diffInDays($sub->ends_at);

                event(new SubscriptionExpiringSoon(
                    subscriber:     $sub->academy,
                    daysLeft:       $daysLeft,
                    subscriberType: 'academy',
                ));
            });
    }
}
