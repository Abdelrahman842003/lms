<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Jobs;

use App\Domains\Lectures\Models\Lecture;
use App\Domains\Application\Services\Teacher\LectureService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EndExpiredLecturesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(LectureService $lectureService): void
    {
        Log::info('Checking for expired lectures (Job)...');

        $count = 0;

        Lecture::where('is_active', true)
            ->where('end_time', '<', now())
            ->chunkById(100, function ($lectures) use ($lectureService, &$count) {
                foreach ($lectures as $lecture) {
                    Log::info("Ending lecture: {$lecture->title} (ID: {$lecture->id})");
                    try {
                        $lectureService->endLecture($lecture);
                        $count++;
                    } catch (\Exception $e) {
                        Log::error("Failed to end lecture {$lecture->id}: " . $e->getMessage());
                    }
                }
            });

        Log::info("Ended {$count} expired lectures.");
    }
}
