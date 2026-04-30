<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Jobs;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Notifications\Events\NewNotificationEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ProcessTenantExpirationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @param Collection<int, Teacher|Academy> $tenants
     */
    public function __construct(
        protected Collection $tenants
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        foreach ($this->tenants as $tenant) {
            $expiresAt = $tenant->plan_expires_at;
            
            if ($expiresAt && $expiresAt->isPast()) {
                $userType = $tenant instanceof Teacher ? 'teacher' : 'academy';
                $title = 'انتهى اشتراكك';
                $message = 'انتهت صلاحية باقة الاشتراك الخاصة بك. يرجى التجديد لمتابعة استخدام كافة المميزات.';
                
                // Notify the tenant
                try {
                    $notificationId = Str::uuid()->toString();
                    
                    $tenant->notifications()->create([
                        'id' => $notificationId,
                        'type' => 'App\\Notifications\\SubscriptionExpiredNotification',
                        'data' => [
                            'title' => $title,
                            'message' => $message,
                            'type' => 'subscription_expired',
                        ],
                        'read_at' => null,
                    ]);

                    broadcast(new NewNotificationEvent(
                        userId: (string) $tenant->id,
                        userType: $userType,
                        notificationId: $notificationId,
                        title: $title,
                        message: $message,
                        data: ['type' => 'subscription_expired'],
                        type: 'subscription_expired',
                    ));
                } catch (\Exception $e) {
                    // Log error if needed
                }
            }
        }
    }
}
