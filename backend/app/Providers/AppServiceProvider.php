<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domains\Auth\Events\UserLoggedIn;
use App\Domains\Auth\Listeners\LogLoginAudit;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Exams\Events\ExamCompleted;
use App\Domains\Exams\Listeners\GrantExamXp;
use App\Domains\Exams\Listeners\RecordMistakes;
use App\Domains\Gamification\Events\BadgeEarned;
use App\Domains\Gamification\Events\XpGranted;
use App\Domains\Lectures\Events\LectureActivated;
use App\Domains\Lectures\Listeners\NotifyGroupOnActivation;
use App\Domains\Notifications\Listeners\BroadcastNotificationSent;
use App\Domains\Subscriptions\Events\SubscriptionExpired;
use App\Domains\Subscriptions\Listeners\SuspendEnrollmentsOnExpiry;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Exams\Models\Exam;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Observers\StudentObserver;
use App\Domains\Enrollments\Observers\EnrollmentObserver;
use App\Domains\Exams\Observers\ExamObserver;
use App\Domains\Lectures\Observers\LectureObserver;
use App\Domains\Exams\Policies\ExamPolicy;
use App\Domains\Enrollments\Policies\GradePolicy;
use App\Domains\Enrollments\Policies\GroupPolicy;
use App\Domains\Lectures\Policies\LecturePolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
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
        // Morph Map — maps legacy App\Models\ strings in DB to actual Domain model classes
        Relation::enforceMorphMap([
            'App\Models\Admin'              => \App\Domains\Auth\Models\Admin::class,
            'App\Models\Teacher'            => \App\Domains\Auth\Models\Teacher::class,
            'App\Models\Student'            => \App\Domains\Auth\Models\Student::class,
            'App\Models\Guardian'           => \App\Domains\Auth\Models\Guardian::class,
            'App\Models\Secretary'          => \App\Domains\Auth\Models\Secretary::class,
            'App\Models\Academy'            => \App\Domains\Auth\Models\Academy::class,
            'App\Models\DeviceToken'        => \App\Domains\Auth\Models\DeviceToken::class,
            'App\Models\LoginAttempt'       => \App\Domains\Auth\Models\LoginAttempt::class,
            'App\Models\ParentDeviceToken'  => \App\Domains\Auth\Models\ParentDeviceToken::class,
            'App\Models\Enrollment'         => \App\Domains\Enrollments\Models\Enrollment::class,
            'App\Models\Grade'              => \App\Domains\Enrollments\Models\Grade::class,
            'App\Models\Group'              => \App\Domains\Enrollments\Models\Group::class,
            'App\Models\Lecture'            => \App\Domains\Lectures\Models\Lecture::class,
            'App\Models\LectureSession'     => \App\Domains\Lectures\Models\LectureSession::class,
            'App\Models\Attendance'         => \App\Domains\Lectures\Models\Attendance::class,
            'App\Models\Exam'               => \App\Domains\Exams\Models\Exam::class,
            'App\Models\ExamAttempt'        => \App\Domains\Exams\Models\ExamAttempt::class,
            'App\Models\ExamResult'         => \App\Domains\Exams\Models\ExamResult::class,
            'App\Models\Question'           => \App\Domains\Exams\Models\Question::class,
            'App\Models\StudentAnswer'      => \App\Domains\Exams\Models\StudentAnswer::class,
            'App\Models\FailedQuestion'     => \App\Domains\Exams\Models\FailedQuestion::class,
            'App\Models\AcademyNotification' => \App\Domains\Notifications\Models\AcademyNotification::class,
            'App\Models\SentNotification'   => \App\Domains\Notifications\Models\SentNotification::class,
            'App\Models\StudentPoint'       => \App\Domains\Gamification\Models\StudentPoint::class,
            'App\Models\PointTransaction'   => \App\Domains\Gamification\Models\PointTransaction::class,
            'App\Models\GamificationSetting' => \App\Domains\Gamification\Models\GamificationSetting::class,
            'App\Models\Subscription'       => \App\Domains\Subscriptions\Models\Subscription::class,
            'App\Models\TeacherSubscription' => \App\Domains\Subscriptions\Models\TeacherSubscription::class,
            'App\Models\AcademySubscription' => \App\Domains\Subscriptions\Models\AcademySubscription::class,
            'App\Models\PlatformPayment'    => \App\Domains\Subscriptions\Models\PlatformPayment::class,
            'App\Models\PaymentLog'         => \App\Domains\Subscriptions\Models\PaymentLog::class,
            'App\Models\Setting'            => \App\Domains\Support\Models\Setting::class,
            'App\Models\SyncError'          => \App\Domains\Support\Models\SyncError::class,
            'App\Models\TeacherAttendanceLog' => \App\Domains\Support\Models\TeacherAttendanceLog::class,
            'App\Models\DailyVoiceLimit'    => \App\Domains\Support\Models\DailyVoiceLimit::class,
        ]);

        // Register Policies
        Gate::policy(Grade::class, GradePolicy::class);
        Gate::policy(Lecture::class, LecturePolicy::class);
        Gate::policy(Exam::class, ExamPolicy::class);
        Gate::policy(Group::class, GroupPolicy::class);

        // Register cache invalidation observers
        Student::observe(StudentObserver::class);
        Enrollment::observe(EnrollmentObserver::class);
        Lecture::observe(LectureObserver::class);
        Exam::observe(ExamObserver::class);

        // Broadcast all database notifications via Reverb for real-time delivery
        Event::listen(NotificationSent::class, BroadcastNotificationSent::class);

        // Domain Events — Auth
        Event::listen(UserLoggedIn::class, LogLoginAudit::class);

        // Domain Events — Lectures
        Event::listen(LectureActivated::class, NotifyGroupOnActivation::class);

        // Domain Events — Subscriptions
        Event::listen(SubscriptionExpired::class, SuspendEnrollmentsOnExpiry::class);

        // Domain Events — Exams
        Event::listen(ExamCompleted::class, [RecordMistakes::class, GrantExamXp::class]);

        // Domain Events — Gamification (placeholder للـ Listeners المستقبلية)
        // Event::listen(XpGranted::class, NotifyXpGranted::class);
        // Event::listen(BadgeEarned::class, NotifyBadgeEarned::class);

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

