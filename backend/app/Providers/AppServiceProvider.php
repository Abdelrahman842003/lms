<?php

declare(strict_types=1);

namespace App\Providers;

// Domain Services
use App\Domains\Gamification\Services\PointCalculator;
use App\Domains\Gamification\Strategies\AttendancePointStrategy;
use App\Domains\Gamification\Strategies\ExamPointStrategy;
use App\Domains\Gamification\Strategies\ManualBonusStrategy;
use App\Domains\Gamification\Strategies\VideoPointStrategy;

// Domain Events
use App\Domains\Auth\Events\UserLoggedIn;
use App\Domains\Exams\Events\ExamCompleted;
use App\Domains\Gamification\Events\BadgeEarned;
use App\Domains\Gamification\Events\XpGranted;
use App\Domains\Lectures\Events\LectureActivated;
use App\Domains\Subscriptions\Events\SubscriptionExpired;

// Domain Listeners
use App\Domains\Auth\Listeners\LogLoginAudit;
use App\Domains\Exams\Listeners\GrantExamXp;
use App\Domains\Exams\Listeners\RecordMistakes;
use App\Domains\Lectures\Listeners\NotifyGroupOnActivation;
use App\Domains\Notifications\Listeners\BroadcastNotificationSent;
use App\Domains\Subscriptions\Listeners\SuspendEnrollmentsOnExpiry;

// Domain Models
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\LoginAttempt;
use App\Domains\Auth\Models\ParentDeviceToken;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\DeviceToken;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Enrollments\Models\StudentActivityLog;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamAttempt;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Exams\Models\FailedQuestion;
use App\Domains\Exams\Models\Question;
use App\Domains\Exams\Models\StudentAnswer;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Gamification\Models\StudentPoint;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Models\LectureSession;
use App\Domains\Notifications\Models\AcademyNotification;
use App\Domains\Notifications\Models\SentNotification;
use App\Domains\Subscriptions\Models\AcademySubscription;
use App\Domains\Subscriptions\Models\PaymentLog;
use App\Domains\Subscriptions\Models\PlatformPayment;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Subscriptions\Models\TeacherSubscription;
use App\Domains\Application\Models\DailyVoiceLimit;
use App\Domains\Application\Models\Setting;
use App\Domains\Application\Models\SyncError;
use App\Domains\Application\Models\TeacherAttendanceLog;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAccessGrant;
use App\Domains\Videos\Models\VideoAccessLog;
use App\Domains\Videos\Models\VideoAttachment;
use App\Domains\Videos\Models\VideoComment;
use App\Domains\Videos\Models\VideoLike;
use App\Domains\Videos\Models\VideoPlaybackToken;
use App\Domains\Videos\Models\VideoQuiz;
use App\Domains\Videos\Models\VideoQuizAttempt;
use App\Domains\Videos\Models\VideoQuizQuestion;
use App\Domains\Videos\Models\VideoReminder;
use App\Domains\Videos\Models\VideoUploadSession;
use App\Domains\Videos\Models\VideoWatchProgress;

// Domain Observers
use App\Domains\Auth\Observers\StudentObserver;
use App\Domains\Enrollments\Observers\EnrollmentObserver;
use App\Domains\Exams\Observers\ExamObserver;
use App\Domains\Lectures\Observers\LectureObserver;

// Domain Policies (existing in Domains)
use App\Domains\Auth\Policies\StudentPolicy;
use App\Domains\Enrollments\Policies\EnrollmentPolicy;
use App\Domains\Enrollments\Policies\GradePolicy;
use App\Domains\Enrollments\Policies\GroupPolicy;
use App\Domains\Exams\Policies\ExamPolicy;
use App\Domains\Lectures\Policies\LecturePolicy;
use App\Domains\Videos\Policies\VideoPolicy;

// Centralized Policies (new in App\Policies)
use App\Domains\Application\Policies\AcademyNotificationPolicy;
use App\Domains\Application\Policies\AcademyPolicy;
use App\Domains\Application\Policies\AcademySubscriptionPolicy;
use App\Domains\Application\Policies\AttendancePolicy;
use App\Domains\Application\Policies\DailyVoiceLimitPolicy;
use App\Domains\Application\Policies\DeviceTokenPolicy;
use App\Domains\Application\Policies\ExamAttemptPolicy;
use App\Domains\Application\Policies\ExamResultPolicy;
use App\Domains\Application\Policies\FailedQuestionPolicy;
use App\Domains\Application\Policies\GamificationSettingPolicy;
use App\Domains\Application\Policies\GuardianPolicy;
use App\Domains\Application\Policies\LectureSessionPolicy;
use App\Domains\Application\Policies\LoginAttemptPolicy;
use App\Domains\Application\Policies\ParentDeviceTokenPolicy;
use App\Domains\Application\Policies\PaymentLogPolicy;
use App\Domains\Application\Policies\PlatformPaymentPolicy;
use App\Domains\Application\Policies\PointTransactionPolicy;
use App\Domains\Application\Policies\QuestionPolicy;
use App\Domains\Application\Policies\SecretaryPolicy;
use App\Domains\Application\Policies\SettingPolicy;
use App\Domains\Application\Policies\StudentActivityLogPolicy;
use App\Domains\Application\Policies\StudentAnswerPolicy;
use App\Domains\Application\Policies\StudentPointPolicy;
use App\Domains\Application\Policies\SubscriptionPolicy;
use App\Domains\Application\Policies\SyncErrorPolicy;
use App\Domains\Application\Policies\TeacherAttendanceLogPolicy;
use App\Domains\Application\Policies\TeacherPolicy;
use App\Domains\Application\Policies\TeacherSubscriptionPolicy;
use App\Domains\Application\Policies\VideoAccessGrantPolicy;
use App\Domains\Application\Policies\VideoAccessLogPolicy;
use App\Domains\Application\Policies\VideoAttachmentPolicy;
use App\Domains\Application\Policies\VideoCommentPolicy;
use App\Domains\Application\Policies\VideoLikePolicy;
use App\Domains\Application\Policies\VideoPlaybackTokenPolicy;
use App\Domains\Application\Policies\VideoQuizAttemptPolicy;
use App\Domains\Application\Policies\VideoQuizPolicy;
use App\Domains\Application\Policies\VideoQuizQuestionPolicy;
use App\Domains\Application\Policies\VideoReminderPolicy;
use App\Domains\Application\Policies\VideoUploadSessionPolicy;
use App\Domains\Application\Policies\VideoWatchProgressPolicy;
use App\Domains\Application\Policies\SentNotificationPolicy;

// Laravel
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

use App\Domains\Notifications\Listeners\NotificationEventSubscriber;
use App\Domains\Notifications\Observers\AnalyticsChannelObserver;
use App\Domains\Notifications\Observers\BroadcastChannelObserver;
use App\Domains\Notifications\Observers\DatabaseChannelObserver;
use App\Domains\Notifications\Observers\FcmChannelObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Tag all point strategies for auto-discovery
        // Note: ManualBonusStrategy is excluded from tagging because it needs
        // factory binding with parameters. It's registered separately below.
        $this->app->tag([
            AttendancePointStrategy::class,
            ExamPointStrategy::class,
            VideoPointStrategy::class,
        ], 'point_strategies');

        // ManualBonusStrategy - factory binding (not singleton) since it's immutable
        // Each resolution creates a new instance with the provided parameters
        $this->app->bind(ManualBonusStrategy::class, function ($app, $params) {
            return new ManualBonusStrategy(
                $params['points'] ?? 0,
                $params['description'] ?? ''
            );
        });

        // Gamification - PointCalculator singleton with auto-discovered strategies
        // Strategies are automatically discovered via container tagging.
        // To add a new strategy, simply add it to the 'point_strategies' tag above.
        $this->app->singleton(PointCalculator::class, function ($app) {
            $calculator = new PointCalculator();

            // Auto-discover all tagged strategies
            foreach ($app->tagged('point_strategies') as $strategy) {
                $calculator->registerStrategy($strategy);
            }

            // Register a default ManualBonusStrategy for discovery/iteration purposes
            // (It's not tagged because it needs factory binding with parameters)
            $calculator->registerStrategy($app->make(ManualBonusStrategy::class));

            return $calculator;
        });

        // Notification channel observers - tagged for DI injection
        $this->app->tag([
            DatabaseChannelObserver::class,
            BroadcastChannelObserver::class,
            FcmChannelObserver::class,
            AnalyticsChannelObserver::class,
        ], 'notification_observers');

        // Bind the subscriber with tagged observers
        $this->app->when(NotificationEventSubscriber::class)
            ->needs('$observers')
            ->giveTagged('notification_observers');
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
            // New enum-backed morph aliases used by the Videos domain
            'academy'                        => \App\Domains\Auth\Models\Academy::class,
            'independent_teacher'            => \App\Domains\Auth\Models\Teacher::class,
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
            'App\Models\Setting'            => \App\Domains\Application\Models\Setting::class,
            'App\Models\SyncError'          => \App\Domains\Application\Models\SyncError::class,
            'App\Models\TeacherAttendanceLog' => \App\Domains\Application\Models\TeacherAttendanceLog::class,
            'App\Models\DailyVoiceLimit'    => \App\Domains\Application\Models\DailyVoiceLimit::class,
            'App\Models\Video'              => \App\Domains\Videos\Models\Video::class,
            'App\Models\VideoAttachment'    => \App\Domains\Videos\Models\VideoAttachment::class,
            'App\Models\VideoComment'       => \App\Domains\Videos\Models\VideoComment::class,
            'App\Models\VideoLike'          => \App\Domains\Videos\Models\VideoLike::class,
            'App\Models\VideoWatchProgress' => \App\Domains\Videos\Models\VideoWatchProgress::class,
        ]);

        // Register Policies - Domain Policies (existing)
        Gate::policy(Enrollment::class, EnrollmentPolicy::class);
        Gate::policy(Grade::class, GradePolicy::class);
        Gate::policy(Group::class, GroupPolicy::class);
        Gate::policy(Lecture::class, LecturePolicy::class);
        Gate::policy(Exam::class, ExamPolicy::class);
        Gate::policy(Video::class, VideoPolicy::class);
        Gate::policy(Student::class, StudentPolicy::class);

        // Register Policies - Centralized Policies (new)
        // Auth Domain
        Gate::policy(Academy::class, AcademyPolicy::class);
        Gate::policy(Teacher::class, TeacherPolicy::class);
        Gate::policy(Secretary::class, SecretaryPolicy::class);
        Gate::policy(Guardian::class, GuardianPolicy::class);
        Gate::policy(DeviceToken::class, DeviceTokenPolicy::class);
        Gate::policy(ParentDeviceToken::class, ParentDeviceTokenPolicy::class);
        Gate::policy(LoginAttempt::class, LoginAttemptPolicy::class);

        // Enrollments Domain
        Gate::policy(StudentActivityLog::class, StudentActivityLogPolicy::class);

        // Exams Domain
        Gate::policy(Question::class, QuestionPolicy::class);
        Gate::policy(ExamAttempt::class, ExamAttemptPolicy::class);
        Gate::policy(ExamResult::class, ExamResultPolicy::class);
        Gate::policy(FailedQuestion::class, FailedQuestionPolicy::class);
        Gate::policy(StudentAnswer::class, StudentAnswerPolicy::class);

        // Gamification Domain
        Gate::policy(StudentPoint::class, StudentPointPolicy::class);
        Gate::policy(PointTransaction::class, PointTransactionPolicy::class);
        Gate::policy(GamificationSetting::class, GamificationSettingPolicy::class);

        // Lectures Domain
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Gate::policy(LectureSession::class, LectureSessionPolicy::class);

        // Notifications Domain
        Gate::policy(AcademyNotification::class, AcademyNotificationPolicy::class);
        Gate::policy(SentNotification::class, SentNotificationPolicy::class);

        // Subscriptions Domain
        Gate::policy(Subscription::class, SubscriptionPolicy::class);
        Gate::policy(TeacherSubscription::class, TeacherSubscriptionPolicy::class);
        Gate::policy(AcademySubscription::class, AcademySubscriptionPolicy::class);
        Gate::policy(PaymentLog::class, PaymentLogPolicy::class);
        Gate::policy(PlatformPayment::class, PlatformPaymentPolicy::class);

        // Support Domain
        Gate::policy(Setting::class, SettingPolicy::class);
        Gate::policy(SyncError::class, SyncErrorPolicy::class);
        Gate::policy(TeacherAttendanceLog::class, TeacherAttendanceLogPolicy::class);
        Gate::policy(DailyVoiceLimit::class, DailyVoiceLimitPolicy::class);

        // Videos Domain
        Gate::policy(VideoComment::class, VideoCommentPolicy::class);
        Gate::policy(VideoLike::class, VideoLikePolicy::class);
        Gate::policy(VideoAccessGrant::class, VideoAccessGrantPolicy::class);
        Gate::policy(VideoAttachment::class, VideoAttachmentPolicy::class);
        Gate::policy(VideoWatchProgress::class, VideoWatchProgressPolicy::class);
        Gate::policy(VideoAccessLog::class, VideoAccessLogPolicy::class);
        Gate::policy(VideoPlaybackToken::class, VideoPlaybackTokenPolicy::class);
        Gate::policy(VideoUploadSession::class, VideoUploadSessionPolicy::class);
        Gate::policy(VideoReminder::class, VideoReminderPolicy::class);
        Gate::policy(VideoQuiz::class, VideoQuizPolicy::class);
        Gate::policy(VideoQuizQuestion::class, VideoQuizQuestionPolicy::class);
        Gate::policy(VideoQuizAttempt::class, VideoQuizAttemptPolicy::class);

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

        // Configure Health Checks (if package is installed)
        if (class_exists(\Spatie\Health\Facades\Health::class) && app()->bound('health')) {
            $checkClasses = [
                'Spatie\\Health\\Checks\\Checks\\OptimizedAppCheck',
                'Spatie\\Health\\Checks\\Checks\\DebugModeCheck',
                'Spatie\\Health\\Checks\\Checks\\EnvironmentCheck',
                'Spatie\\Health\\Checks\\Checks\\DatabaseCheck',
                'Spatie\\Health\\Checks\\Checks\\UsedDiskSpaceCheck',
                'Spatie\\Health\\Checks\\Checks\\RedisMemoryUsageCheck',
                'Spatie\\Health\\Checks\\Checks\\HorizonCheck',
                'Spatie\\Health\\Checks\\Checks\\BackupsCheck',
            ];

            $checks = [];
            foreach ($checkClasses as $checkClass) {
                if (class_exists($checkClass)) {
                    $checks[] = $checkClass::new();
                }
            }

            if ($checks !== []) {
                \Spatie\Health\Facades\Health::checks($checks);
            }
        }

        // Configure Rate Limiters
        $this->configureRateLimiting();

        // Configure Google Analytics from saved settings if available
        try {
            $propertyId = Setting::getValue('analytics_property_id');
            if (! empty($propertyId)) {
                config(['analytics.property_id' => $propertyId]);
            }

            $serviceAccountJson = Setting::getValue('analytics_service_account_json');
            if (! empty($serviceAccountJson)) {
                $decoded = json_decode($serviceAccountJson, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    config(['analytics.service_account_credentials_json' => $decoded]);
                }
            }
        } catch (\Throwable $e) {
            // Ignore if settings table isn't ready yet
        }

        // Force Arabic translations for plugins
        $this->app->extend('translator', function ($translator) {
            $translator->addLines([
                'google-analytics::widgets.navigation_label' => 'تحليلات جوجل',
                'google-analytics::widgets.title' => 'تحليلات جوجل',
                'filament-spatie-backup::backup.pages.backups.navigation.label' => 'النسخ الاحتياطي',
                'filament-spatie-backup::backup.pages.backups.heading' => 'النسخ الاحتياطي',
                'filament-spatie-backup::backup.pages.backups.navigation.group' => 'الإعدادات',
            ], 'ar');
            return $translator;
        });
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

        // Authentication endpoints (login, register, password reset)
        // Strict rate limiting to prevent brute force attacks
        RateLimiter::for('auth', function (Request $request) {
            return [
                // 5 attempts per minute per email
                Limit::perMinute(5)->by($request->email ?? $request->ip()),
                // 10 attempts per minute per IP (covers multiple emails)
                Limit::perMinute(10)->by($request->ip()),
            ];
        });

        // Registration rate limiting - prevent bot registration
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Password reset rate limiting - prevent email flooding
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(3)->by($request->email ?? $request->ip());
        });

        // Token refresh rate limiting - prevent token abuse
        RateLimiter::for('token-refresh', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Payment endpoints - prevent duplicate charges and abuse
        RateLimiter::for('payments', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Notification endpoints - prevent spam
        RateLimiter::for('notifications', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // Voice notification endpoints - stricter limit due to cost
        RateLimiter::for('voice-notifications', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Video streaming endpoints - allow normal viewing
        RateLimiter::for('video-stream', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Sensitive video playback endpoints (token generation)
        RateLimiter::for('video-playback', function (Request $request) {
            return Limit::perMinute(30)->by(($request->user()?->id ?? 'guest') . '|' . $request->ip());
        });

        // Video upload endpoints - prevent storage abuse
        RateLimiter::for('video-upload', function (Request $request) {
            return Limit::perMinute(100)->by(($request->user()?->id ?? 'guest') . '|' . $request->ip());
        });

        // General file upload endpoints - prevent storage abuse
        RateLimiter::for('uploads', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Avatar upload - specific limit for profile pictures
        RateLimiter::for('avatar-upload', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        // Exam submission endpoints - prevent cheating attempts
        RateLimiter::for('exam-submit', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // Attendance marking - prevent spam
        RateLimiter::for('attendance', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });
    }
}
