<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Jobs;

use App\Domains\Lectures\Actions\CloseLectureAction;
use App\Domains\Lectures\Models\Lecture;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * يُغلق المحاضرات النشطة التي تجاوزت مدتها.
 * يُشغَّل من Scheduler كل 15 دقيقة.
 */
class CloseExpiredLecture implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;


    public function handle(CloseLectureAction $action): void
    {
        // المحاضرات النشطة التي تجاوزت وقت الانتهاء
        Lecture::query()
            ->where('is_active', true)
            ->whereNotNull('end_time')
            ->where('end_time', '<=', now())
            ->get()
            ->each(function (Lecture $lecture) use ($action) {
                try {
                    $action->execute($lecture);
                } catch (\Throwable) {
                    // تجاهل الأخطاء الفردية — نكمل باقي المحاضرات
                }
            });
    }
}
