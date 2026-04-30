<?php

use App\Domains\Gamification\Jobs\RecalculateLeaderboard;
use App\Domains\Lectures\Jobs\CloseExpiredLecture;
use App\Domains\Subscriptions\Jobs\CheckExpiringSubscriptions;
use App\Domains\Subscriptions\Jobs\ProcessExpiredSubscriptions;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('debug:academy', function () {
    $academy = \App\Domains\Auth\Models\Academy::first();
    if (!$academy) {
        $this->error('No academy found');
        return;
    }
    $this->info('Academy: ' . $academy->name);
    try {
        $teachers = $academy->teachers()->paginate(10);
        $this->info('Teachers count: ' . $teachers->count());
        foreach ($teachers as $teacher) {
             $this->info('Teacher: ' . $teacher->name);
             // Trigger serialization
             $json = $teacher->toJson();
             $this->info('Serialized: ' . substr($json, 0, 50));
        }
    } catch (\Exception $e) {
        $this->error($e->getMessage());
        $this->error($e->getTraceAsString());
    }
});

// ─── Domain Scheduler Jobs ─────────────────────────────────────────────────

// إغلاق المحاضرات المنتهية كل 15 دقيقة (safety net)
Schedule::job(CloseExpiredLecture::class)->everyFifteenMinutes();

// فحص الاشتراكات المنتهية (تحديث الحالة) — يومياً في منتصف الليل
Schedule::job(ProcessExpiredSubscriptions::class)->dailyAt('00:05');

// إشعار الاشتراكات التي ستنتهي خلال 7 أيام — يومياً
Schedule::job(CheckExpiringSubscriptions::class)->dailyAt('09:00');

// إعادة حساب Leaderboard كل ساعة
Schedule::job(RecalculateLeaderboard::class)->hourly();

// ─── Token Security Cleanup ─────────────────────────────────────────────────

// Clean up expired tokens daily at 2 AM (off-peak hours)
Schedule::command('tokens:cleanup')->dailyAt('02:00');

// التنظيف الدوري للملفات المؤقتة
Schedule::command('system:cleanup')->dailyAt('03:00');

// معالجة الاشتراكات المنتهية للطلاب والمدرسين والأكاديميات
Schedule::command('subscriptions:process-expirations')->dailyAt('04:00');

// تنظيف سجلات النشاط القديمة (أكثر من 90 يوم)
Schedule::command('activitylog:clean')->weekly();

