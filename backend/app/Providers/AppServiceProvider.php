<?php

namespace App\Providers;

use App\Listeners\BroadcastNotificationSent;
use App\Models\Enrollment;
use App\Models\Student;
use App\Observers\EnrollmentObserver;
use App\Observers\StudentObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
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

        // Configure Rate Limiters
        $this->configureRateLimiting();
    }

    /**
     * Configure rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // General API rate limit: 60 requests per minute
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Login rate limit: 10 attempts per minute per IP
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });
    }
}

