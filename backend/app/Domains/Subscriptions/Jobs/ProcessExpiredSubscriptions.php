<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Jobs;

use App\Domains\Subscriptions\Events\SubscriptionExpired;
use App\Domains\Subscriptions\Models\TeacherSubscription;
use App\Domains\Subscriptions\Models\AcademySubscription;
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

    public string $queue = 'default';

    public function handle(): void
    {
        $this->processTeachers();
        $this->processAcademies();
    }

    private function processTeachers(): void
    {
        TeacherSubscription::query()
            ->where('status', 'active')
            ->where('ends_at', '<', now())
            ->with('teacher')
            ->get()
            ->each(function (TeacherSubscription $sub) {
                $sub->update(['status' => 'expired']);

                event(new SubscriptionExpired(
                    subscriber:     $sub->teacher,
                    subscriberType: 'teacher',
                ));
            });
    }

    private function processAcademies(): void
    {
        AcademySubscription::query()
            ->where('status', 'active')
            ->where('ends_at', '<', now())
            ->with('academy')
            ->get()
            ->each(function (AcademySubscription $sub) {
                $sub->update(['status' => 'expired']);

                event(new SubscriptionExpired(
                    subscriber:     $sub->academy,
                    subscriberType: 'academy',
                ));
            });
    }
}
