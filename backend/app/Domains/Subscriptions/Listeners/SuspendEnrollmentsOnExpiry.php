<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Listeners;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Subscriptions\Events\SubscriptionExpired;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * عند انتهاء الاشتراك → يُعطّل كل Enrollments النشطة المرتبطة.
 */
class SuspendEnrollmentsOnExpiry implements ShouldQueue
{

    public function handle(SubscriptionExpired $event): void
    {
        $subscriber     = $event->subscriber;
        $subscriberType = $event->subscriberType;

        if ($subscriberType === 'teacher') {
            Enrollment::where('teacher_id', $subscriber->id)
                ->where('is_active', true)
                ->update([
                    'is_active'     => false,
                    'teacher_notes' => 'تم الإيقاف تلقائياً بسبب انتهاء الاشتراك.',
                ]);
        } elseif ($subscriberType === 'academy') {
            Enrollment::where('academy_id', $subscriber->id)
                ->where('is_active', true)
                ->update([
                    'is_active'     => false,
                    'teacher_notes' => 'تم الإيقاف تلقائياً بسبب انتهاء اشتراك المنظمة.',
                ]);
        }
    }
}
