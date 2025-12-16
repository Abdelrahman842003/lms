<?php

namespace App\Providers;

use App\Listeners\BroadcastNotificationSent;
use App\Models\Enrollment;
use App\Models\Student;
use App\Observers\EnrollmentObserver;
use App\Observers\StudentObserver;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register cache invalidation observers
        Student::observe(StudentObserver::class);
        Enrollment::observe(EnrollmentObserver::class);

        // Broadcast all database notifications via Reverb for real-time delivery
        Event::listen(NotificationSent::class, BroadcastNotificationSent::class);
    }
}

