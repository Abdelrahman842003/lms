<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Jobs;

use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\StudentPoint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

/**
 * يُعيد حساب ترتيب Leaderboard لكل مدرس كل ساعة.
 * يُخزّن النتائج في Cache لأداء أسرع.
 *
 * Cache key: leaderboard.teacher.{teacher_id}
 * TTL: 65 دقيقة (أطول من دورة الـ Scheduler بقليل)
 */
class RecalculateLeaderboard implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;


    public function handle(): void
    {
        // جلب المدرسين الذين الـ leaderboard مفعّل لديهم
        $settings = GamificationSetting::where('is_enabled', true)
            ->where('show_leaderboard', true)
            ->get();

        foreach ($settings as $setting) {
            $this->recalculateForTeacher($setting);
        }
    }

    private function recalculateForTeacher(GamificationSetting $setting): void
    {
        $size = $setting->leaderboard_size ?? 5;

        $leaderboard = StudentPoint::where('teacher_id', $setting->teacher_id)
            ->orderByDesc('total_points')
            ->limit($size)
            ->with('student:id,name')
            ->get()
            ->map(fn ($point, $index) => [
                'rank'         => $index + 1,
                'student_id'   => $point->student_id,
                'student_name' => $point->student?->name ?? 'غير معروف',
                'total_points' => $point->total_points,
                'streak'       => $point->attendance_streak,
            ])
            ->all();

        Cache::put(
            "leaderboard.teacher.{$setting->teacher_id}",
            $leaderboard,
            now()->addMinutes(65),
        );
    }
}
